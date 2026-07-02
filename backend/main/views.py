import json
import secrets
import zoneinfo
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Count
from collections import Counter

from .models import EmotionEntry, WeatherComparison, AuthToken
from .geocoding_service import resolve_location
from .weather_service import fetch_real_weather, fetch_current_weather_detail, REGION_CITY_MAP

# 17 provinces coordinates and defaults
PROVINCE_DEFAULTS = [
    { "id": "p-seoul",    "name": "서울", "lat": 37.566, "lng": 126.978, "emotion": "cloudy" },
    { "id": "p-busan",    "name": "부산", "lat": 35.180, "lng": 129.076, "emotion": "sunny" },
    { "id": "p-incheon",  "name": "인천", "lat": 37.456, "lng": 126.705, "emotion": "rainy" },
    { "id": "p-daegu",    "name": "대구", "lat": 35.871, "lng": 128.601, "emotion": "cloudy" },
    { "id": "p-gwangju",  "name": "광주", "lat": 35.160, "lng": 126.853, "emotion": "sunny" },
    { "id": "p-daejeon",  "name": "대전", "lat": 36.350, "lng": 127.385, "emotion": "storm" },
    { "id": "p-ulsan",    "name": "울산", "lat": 35.538, "lng": 129.311, "emotion": "rainy" },
    { "id": "p-sejong",   "name": "세종", "lat": 36.480, "lng": 127.289, "emotion": "cloudy" },
    { "id": "p-gyeonggi",  "name": "경기", "lat": 37.300, "lng": 127.200, "emotion": "sunny" },
    { "id": "p-gangwon",   "name": "강원", "lat": 37.800, "lng": 128.200, "emotion": "cloudy" },
    { "id": "p-chungbuk",  "name": "충북", "lat": 36.800, "lng": 127.700, "emotion": "rainy" },
    { "id": "p-chungnam",  "name": "충남", "lat": 36.518, "lng": 126.800, "emotion": "sunny" },
    { "id": "p-jeonbuk",   "name": "전북", "lat": 35.718, "lng": 127.153, "emotion": "cloudy" },
    { "id": "p-jeonnam",   "name": "전남", "lat": 34.868, "lng": 126.991, "emotion": "rainy" },
    { "id": "p-gyeongbuk", "name": "경북", "lat": 36.492, "lng": 128.889, "emotion": "storm" },
    { "id": "p-gyeongnam", "name": "경남", "lat": 35.461, "lng": 128.213, "emotion": "cloudy" },
    { "id": "p-jeju",     "name": "제주", "lat": 33.500, "lng": 126.531, "emotion": "sunny" },
]

KST = zoneinfo.ZoneInfo("Asia/Seoul")

def find_nearest_province(lat, lng):
    min_dist = float('inf')
    nearest = PROVINCE_DEFAULTS[0]
    for p in PROVINCE_DEFAULTS:
        dist = (p["lat"] - lat) ** 2 + (p["lng"] - lng) ** 2
        if dist < min_dist:
            min_dist = dist
            nearest = p
    return nearest


def _get_user_from_request(request):
    """Authorization: Bearer <token> 헤더에서 유저 반환. 없거나 유효하지 않으면 None."""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return None
    token_key = auth_header[7:]
    try:
        return AuthToken.objects.select_related('user').get(key=token_key).user
    except AuthToken.DoesNotExist:
        return None


@csrf_exempt
def check_username_api(request):
    """GET /api/auth/check-username/?username=<username>"""
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    username = request.GET.get('username', '').strip()
    if not username:
        return JsonResponse({"error": "username is required"}, status=400)
    available = not User.objects.filter(username=username).exists()
    return JsonResponse({"available": available})


@csrf_exempt
def signup_api(request):
    """POST /api/auth/signup/  Body: { username, password }"""
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return JsonResponse({"error": "username and password are required"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "이미 사용 중인 아이디에요"}, status=409)

    User.objects.create_user(username=username, password=password)
    return JsonResponse({"message": "회원가입 성공"}, status=201)


@csrf_exempt
def login_api(request):
    """POST /api/auth/login/  Body: { username, password }"""
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = authenticate(username=username, password=password)
    if user is None:
        return JsonResponse({"error": "아이디 또는 비밀번호가 틀렸어요"}, status=401)

    token_key = secrets.token_urlsafe(48)
    AuthToken.objects.update_or_create(user=user, defaults={"key": token_key})

    return JsonResponse({
        "access_token": token_key,
        "user": {"username": user.username}
    })


@csrf_exempt
def delete_me_api(request):
    """DELETE /api/auth/me/"""
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    user = _get_user_from_request(request)
    if user is None:
        return JsonResponse({"error": "인증이 필요해요"}, status=401)

    EmotionEntry.objects.filter(user=user).update(user=None)
    user.delete()
    return JsonResponse({}, status=204)


@csrf_exempt
def emotions_api(request):
    """
    Handles GET /api/emotions/ and POST /api/emotions/
    """
    
    if request.method == 'GET':
        today_date = datetime.now(KST).date()
        
        # Load all entries for today
        emotions_today = EmotionEntry.objects.filter(created_at__date=today_date).order_by('-created_at')
        
        # 1. Individual marks (today's entries)
        individual_marks = []
        province_emotions_map = {p["name"]: [] for p in PROVINCE_DEFAULTS}
        
        for e in emotions_today:
            province_emotions_map[e.region].append(e.emotion_type)
            individual_marks.append({
                "id": e.id,
                "coordinates": [e.longitude, e.latitude] if e.longitude else [127.0, 37.0],
                "emotion": e.emotion_type,
                "comment": e.comment,
                "timestamp": int(e.created_at.timestamp() * 1000),
                "region": e.region
            })

        # 오늘 기록이 없으면 개별 마커도 비운다(과거 데이터로 채우지 않음).
        # 시/도 대표 마커·날씨 비교와 동일하게 '오늘 기록 없음'을 그대로 반영 → '?' 설계와 일관.

        # 2. Province representative marks (calculated dynamically from today's data)
        province_masks = []
        for p in PROVINCE_DEFAULTS:
            user_emotions = province_emotions_map[p["name"]]
            if user_emotions:
                counter = Counter(user_emotions)
                rep_emotion = counter.most_common(1)[0][0]
            else:
                rep_emotion = None  # 오늘 기록 없음 → 프론트에서 '?' 마커로 표시
                
            province_masks.append({
                "id": p["id"],
                "coordinates": [p["lng"], p["lat"]],
                "emotion": rep_emotion,
                "label": p["name"]
            })
            
        return JsonResponse({
            "individual_marks": individual_marks,
            "province_masks": province_masks
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            session_id = data.get('session_id')
            emotion_type = data.get('emotion_type')
            comment = data.get('comment', '')
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            region = data.get('region')

            if not session_id or not emotion_type:
                return JsonResponse({"error": "Missing required fields (session_id, emotion_type)"}, status=400)

            if emotion_type not in ['sunny', 'cloudy', 'rainy', 'storm']:
                return JsonResponse({"error": "Invalid emotion type"}, status=400)

            # 로그인 유저 확인
            auth_user = _get_user_from_request(request)

            # Resolve region name
            resolved_region = region
            if latitude is not None and longitude is not None:
                nearest = find_nearest_province(float(latitude), float(longitude))
                resolved_region = nearest["name"]

            if not resolved_region:
                resolved_region = "서울"

            # Keep region in bounds
            prov_names = [p["name"] for p in PROVINCE_DEFAULTS]
            if resolved_region not in prov_names:
                resolved_region = "서울"

            # If coordinates are missing, fill them with province centers
            if latitude is None or longitude is None:
                for p in PROVINCE_DEFAULTS:
                    if p["name"] == resolved_region:
                        latitude = p["lat"]
                        longitude = p["lng"]
                        break

            # Check 1 limit per day per user (reset at midnight KST)
            today_date = datetime.now(KST).date()
            if auth_user:
                existing_entry = EmotionEntry.objects.filter(
                    user=auth_user,
                    created_at__date=today_date
                ).first()
            else:
                existing_entry = EmotionEntry.objects.filter(
                    session_id=session_id,
                    created_at__date=today_date
                ).first()

            if existing_entry:
                # Update today's entry (마지막 수정 시각으로 created_at 갱신 → 마커 시간이 최신 활동 반영)
                existing_entry.emotion_type = emotion_type
                existing_entry.comment = comment[:50]
                existing_entry.region = resolved_region
                existing_entry.latitude = float(latitude)
                existing_entry.longitude = float(longitude)
                existing_entry.created_at = datetime.now(KST)
                existing_entry.save()
                entry = existing_entry
                status_code = 200
            else:
                # Create new entry
                entry = EmotionEntry.objects.create(
                    session_id=session_id,
                    user=auth_user,
                    region=resolved_region,
                    emotion_type=emotion_type,
                    comment=comment[:50],
                    latitude=float(latitude),
                    longitude=float(longitude)
                )
                status_code = 201
                
            return JsonResponse({
                "id": entry.id,
                "region": entry.region,
                "emotion": entry.emotion_type,
                "comment": entry.comment,
                "timestamp": int(entry.created_at.timestamp() * 1000)
            }, status=status_code)
            
        except (json.JSONDecodeError, ValueError) as err:
            return JsonResponse({"error": f"Invalid request parameters: {str(err)}"}, status=400)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


def region_detail_api(request, region_name):
    """
    GET /api/emotions/region/<str:region_name>/
    Returns stats and recent comments for a specific region.
    """
    
    # Check if region name exists
    prov_names = [p["name"] for p in PROVINCE_DEFAULTS]
    if region_name not in prov_names:
        return JsonResponse({"error": "Region not found"}, status=404)
        
    # Get all entries for this region
    entries = EmotionEntry.objects.filter(region=region_name).order_by('-created_at')
    
    # Calculate counts (distribution stats)
    counts = {
        'sunny': 0,
        'cloudy': 0,
        'rainy': 0,
        'storm': 0
    }
    
    # Get recent comments (non-empty comments)
    feed = []
    for e in entries:
        counts[e.emotion_type] += 1
        if e.comment:
            feed.append({
                "id": e.id,
                "emotion": e.emotion_type,
                "comment": e.comment,
                "timestamp": int(e.created_at.timestamp() * 1000)
            })

    return JsonResponse({
        "region": region_name,
        "total": entries.count(),
        "stats": counts,
        "feed": feed[:20]  # Return last 20 comments
    })


def weather_compare_api(request):
    """
    GET /api/emotions/compare/
    Compare OpenWeatherMap current weather vs daily dominant emotion weather for each region.
    """
    today_date = datetime.now(KST).date()
    
    comparison_data = []
    
    for p in PROVINCE_DEFAULTS:
        region = p["name"]
        
        # 1. Fetch current weather (with caching/fallback inside fetch_real_weather)
        real_info = fetch_real_weather(region)
        real_w = real_info["weather"]
        real_t = real_info["temp"]
        
        # 2. Fetch dominant emotion for today
        today_entries = EmotionEntry.objects.filter(region=region, created_at__date=today_date)
        if today_entries.exists():
            counter = Counter([e.emotion_type for e in today_entries])
            dominant = counter.most_common(1)[0][0]
        else:
            dominant = None  # 오늘 기록 없음 → 프론트에서 '?'(데이터 없음) 표시 (지도와 동일)

        # Log to DB for caching/history records if not already exist (기록 있을 때만)
        if dominant:
            try:
                WeatherComparison.objects.get_or_create(
                    region=region,
                    date=today_date,
                    defaults={
                        "real_weather": real_w,
                        "real_temp": real_t,
                        "dominant_emotion": dominant
                    }
                )
            except Exception:
                pass  # Avoid conflicts on simultaneous requests
            
        comparison_data.append({
            "region": region,
            "real_weather": real_w,
            "real_temp": real_t,
            "emotion_weather": dominant,
            "match": real_w == dominant
        })
        
    return JsonResponse(comparison_data, safe=False)


def history_api(request):
    """
    GET /api/emotions/history/
    Returns daily counts for each of the 4 emotions for the last 7 days (KST 기준).
    """
    today_kst = datetime.now(KST).date()

    history_data = []

    # 최근 7일 (KST 자정 경계로 집계 — POST 제한 로직과 동일 기준)
    for day_offset in range(6, -1, -1):
        day = today_kst - timedelta(days=day_offset)
        start = datetime(day.year, day.month, day.day, tzinfo=KST)
        end = start + timedelta(days=1)

        counts = {'sunny': 0, 'cloudy': 0, 'rainy': 0, 'storm': 0}
        for e in EmotionEntry.objects.filter(created_at__gte=start, created_at__lt=end):
            if e.emotion_type in counts:
                counts[e.emotion_type] += 1

        history_data.append({"date": day.strftime('%Y-%m-%d'), **counts})

    return JsonResponse(history_data, safe=False)


def weather_current_api(request):
    """
    GET /api/weather/?region=<name>
    프론트가 직접 OpenWeather를 호출하지 않도록 서버에서 대신 조회한다(API 키 비노출).
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    region = request.GET.get('region', '').strip()
    if not region:
        return JsonResponse({"error": "region is required"}, status=400)

    detail = fetch_current_weather_detail(region)
    if not detail:
        return JsonResponse({"available": False})
    return JsonResponse({"available": True, **detail})


def location_resolve_api(request):
    """
    GET /api/location/resolve/?lat=<latitude>&lng=<longitude>
    Returns a readable Korean region name for browser coordinates.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    lat_value = request.GET.get('lat')
    lng_value = request.GET.get('lng')

    if lat_value is None or lng_value is None:
        return JsonResponse({"error": "Missing required query parameters (lat, lng)"}, status=400)

    try:
        lat = float(lat_value)
        lng = float(lng_value)
    except ValueError:
        return JsonResponse({"error": "lat and lng must be valid numbers"}, status=400)

    if not (33.0 <= lat <= 39.5 and 124.0 <= lng <= 132.0):
        return JsonResponse({"error": "Coordinates are outside supported Korea bounds"}, status=400)

    return JsonResponse(resolve_location(lat, lng))


def region_history_api(request, region_name):
    """
    GET /api/emotions/region/<name>/history/?days=7
    Returns per-day emotion counts for the given region.
    """

    prov_names = [p["name"] for p in PROVINCE_DEFAULTS]
    if region_name not in prov_names:
        return JsonResponse({"error": "Region not found"}, status=404)

    try:
        days = int(request.GET.get('days', 7))
        days = max(1, min(days, 90))
    except ValueError:
        return JsonResponse({"error": "days must be an integer"}, status=400)

    today_kst = datetime.now(KST).date()
    history_data = []

    for day_offset in range(days - 1, -1, -1):
        day = today_kst - timedelta(days=day_offset)
        start = datetime(day.year, day.month, day.day, tzinfo=KST)
        end = start + timedelta(days=1)
        counts = {'sunny': 0, 'cloudy': 0, 'rainy': 0, 'storm': 0}
        for e in EmotionEntry.objects.filter(region=region_name, created_at__gte=start, created_at__lt=end):
            if e.emotion_type in counts:
                counts[e.emotion_type] += 1
        history_data.append({"date": day.strftime('%Y-%m-%d'), **counts})

    return JsonResponse(history_data, safe=False)


def _can_modify_entry(entry, auth_user, session_id):
    """엔트리 소유자 확인: 로그인 유저가 남긴 기록은 본인만, 비로그인 기록은 session_id 일치할 때만 허용."""
    if entry.user_id is not None:
        return auth_user is not None and auth_user.id == entry.user_id
    return bool(session_id) and session_id == entry.session_id


@csrf_exempt
def emotion_detail_api(request, entry_id):
    """
    PATCH /api/emotions/<id>/ — 감정·코멘트 수정 (본인만)
    DELETE /api/emotions/<id>/ — 기록 삭제 (본인만)
    """
    try:
        entry = EmotionEntry.objects.get(id=entry_id)
    except EmotionEntry.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

    auth_user = _get_user_from_request(request)

    if request.method == 'PATCH':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError as e:
            return JsonResponse({"error": str(e)}, status=400)

        if not _can_modify_entry(entry, auth_user, data.get('session_id')):
            return JsonResponse({"error": "권한이 없어요"}, status=403)

        try:
            if 'emotion_type' in data:
                if data['emotion_type'] not in ['sunny', 'cloudy', 'rainy', 'storm']:
                    return JsonResponse({"error": "Invalid emotion type"}, status=400)
                entry.emotion_type = data['emotion_type']
            if 'comment' in data:
                entry.comment = data['comment'][:50]
            entry.save()
            return JsonResponse({
                "id": entry.id,
                "region": entry.region,
                "emotion": entry.emotion_type,
                "comment": entry.comment,
                "timestamp": int(entry.created_at.timestamp() * 1000)
            })
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

    elif request.method == 'DELETE':
        session_id = request.GET.get('session_id')
        if not _can_modify_entry(entry, auth_user, session_id):
            return JsonResponse({"error": "권한이 없어요"}, status=403)
        entry.delete()
        return JsonResponse({}, status=204)

    return JsonResponse({"error": "Method not allowed"}, status=405)
