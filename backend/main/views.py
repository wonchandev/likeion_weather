import json
import zoneinfo
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Count
from collections import Counter

from .models import EmotionEntry, WeatherComparison
from .weather_service import fetch_real_weather, REGION_CITY_MAP

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

def populate_mock_history_if_empty():
    """
    Populate database with realistic historical mock data for 7-day trend
    and comparison if EmotionEntry is completely empty.
    """
    if EmotionEntry.objects.exists():
        return
        
    print("Populating database with historical mock data...")
    now = timezone.now()
    
    comments = {
        'sunny': ["오늘 날씨처럼 기분도 맑아요!", "나들이 가기 좋은 날씨!", "기분이 최고네요", "퇴근하고 맛있는 거 먹어야지", "과제 끝나서 행복함"],
        'cloudy': ["조금 꿀꿀한 오후", "구름이 많네요", "기분이 그냥 그래요", "멍하니 하늘 보고 있는 중", "내일은 해가 떴으면 좋겠다"],
        'rainy': ["비가 오니까 차분해집니다", "우산을 안 가져왔어요 ㅠㅠ", "막걸리에 파전 땡기는 날", "센치한 밤이네요", "빗소리 듣기 좋습니다"],
        'storm': ["과제 폭탄 맞음...", "오늘 완전 멘탈 바사삭", "번개 조심하세요", "기분이 너무 어둡습니다", "시험 망침 ㅠㅠ"]
    }
    
    # Generate mock entries for the past 7 days (today - 6 days to today)
    for day_offset in range(6, -1, -1):
        date = (now - timedelta(days=day_offset)).date()
        
        # Determine day of week to fluctuate counts
        weekday = date.weekday()
        # Weekends have more sunny emotions, Mondays have more storm/cloudy
        num_entries = 12 if weekday >= 5 else 8
        
        for i in range(num_entries):
            # Pick a random region
            p = random_choice(PROVINCE_DEFAULTS)
            # Pick an emotion with custom weights based on day of week
            if weekday == 0:  # Monday
                emotions = ['sunny', 'cloudy', 'rainy', 'storm']
                weights = [0.2, 0.4, 0.2, 0.2]
            elif weekday >= 5:  # Weekend
                emotions = ['sunny', 'cloudy', 'rainy', 'storm']
                weights = [0.6, 0.2, 0.15, 0.05]
            else:  # Normal days
                emotions = ['sunny', 'cloudy', 'rainy', 'storm']
                weights = [0.4, 0.3, 0.2, 0.1]
            
            emotion = random_weighted_choice(emotions, weights)
            comment = random_choice(comments[emotion])
            
            # Generate deterministic hours for distribution
            hour = (i * 3 + day_offset) % 24
            entry_time = timezone.make_aware(
                datetime(date.year, date.month, date.day, hour, 0, 0),
                KST
            )
            
            EmotionEntry.objects.create(
                session_id=f"mock-user-{day_offset}-{i}",
                region=p["name"],
                emotion_type=emotion,
                comment=comment,
                latitude=p["lat"] + (random_diff() * 0.1),
                longitude=p["lng"] + (random_diff() * 0.1),
                created_at=entry_time
            )
            
        # Also pre-generate historical WeatherComparison entries
        for p in PROVINCE_DEFAULTS:
            # Deterministic weather
            val = sum(ord(c) for c in p["name"]) + date.day
            weathers = ["sunny", "cloudy", "rainy", "storm"]
            real_w = weathers[val % 4]
            real_t = 15.0 + (val % 15) if 4 <= date.month <= 9 else 0.0 + (val % 10)
            
            # Get dominant emotion for that date in mock
            entries = EmotionEntry.objects.filter(region=p["name"], created_at__date=date)
            if entries.exists():
                counts = Counter([e.emotion_type for e in entries])
                dominant = counts.most_common(1)[0][0]
            else:
                dominant = p["emotion"]
                
            WeatherComparison.objects.create(
                region=p["name"],
                date=date,
                real_weather=real_w,
                real_temp=round(real_t, 1),
                dominant_emotion=dominant
            )

# Quick random helper functions to avoid importing external random
def random_choice(lst):
    import time
    t = int(time.time() * 1000)
    return lst[t % len(lst)]

def random_diff():
    import time
    t = int(time.time() * 1000)
    return ((t % 200) - 100) / 100.0  # -1.0 to 1.0

def random_weighted_choice(options, weights):
    import time
    t = (int(time.time() * 1000) % 100) / 100.0
    cum = 0
    for opt, w in zip(options, weights):
        cum += w
        if t <= cum:
            return opt
    return options[0]


@csrf_exempt
def emotions_api(request):
    """
    Handles GET /api/emotions/ and POST /api/emotions/
    """
    populate_mock_history_if_empty()
    
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
            
        # If today's individual marks are empty, return some recent mock ones so it doesn't look blank
        if not individual_marks:
            # Fall back to past 3 days to show data
            recent_emotions = EmotionEntry.objects.all().order_by('-created_at')[:30]
            for e in recent_emotions:
                individual_marks.append({
                    "id": e.id,
                    "coordinates": [e.longitude, e.latitude] if e.longitude else [127.0, 37.0],
                    "emotion": e.emotion_type,
                    "comment": e.comment,
                    "timestamp": int(e.created_at.timestamp() * 1000),
                    "region": e.region
                })
        
        # 2. Province representative marks (calculated dynamically from today's data)
        province_masks = []
        for p in PROVINCE_DEFAULTS:
            user_emotions = province_emotions_map[p["name"]]
            if user_emotions:
                counter = Counter(user_emotions)
                rep_emotion = counter.most_common(1)[0][0]
            else:
                rep_emotion = p["emotion"]  # fallback to defaults
                
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
            
            # Resolve region name
            resolved_region = region
            if latitude is not None and longitude is not None:
                nearest = find_nearest_province(float(latitude), float(longitude))
                resolved_region = nearest["name"]
            
            if not resolved_region:
                # Fallback to Seoul if region is not resolved
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
            existing_entry = EmotionEntry.objects.filter(
                session_id=session_id, 
                created_at__date=today_date
            ).first()
            
            if existing_entry:
                # Update today's entry
                existing_entry.emotion_type = emotion_type
                existing_entry.comment = comment[:50]
                existing_entry.region = resolved_region
                existing_entry.latitude = float(latitude)
                existing_entry.longitude = float(longitude)
                existing_entry.save()
                entry = existing_entry
                status_code = 200
            else:
                # Create new entry
                entry = EmotionEntry.objects.create(
                    session_id=session_id,
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
    populate_mock_history_if_empty()
    
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
            
    # Fallback default mock comments if feed is empty
    if not feed:
        feed = [
            {"id": -1, "emotion": "sunny", "comment": f"오늘 {region_name}은 살기 좋습니다!", "timestamp": int((timezone.now() - timedelta(hours=2)).timestamp() * 1000)},
            {"id": -2, "emotion": "cloudy", "comment": "평범하고 한산한 하루네요.", "timestamp": int((timezone.now() - timedelta(hours=5)).timestamp() * 1000)}
        ]
        
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
    populate_mock_history_if_empty()
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
            dominant = p["emotion"]  # fallback
            
        # Log to DB for caching/history records if not already exist
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
    Returns daily counts for each of the 4 emotions for the last 7 days.
    """
    populate_mock_history_if_empty()
    now = timezone.now()
    
    history_data = []
    
    # Query past 7 calendar days
    for day_offset in range(6, -1, -1):
        date = (now - timedelta(days=day_offset)).date()
        date_str = date.strftime('%m-%d')
        
        # Group entries by emotion_type for this date
        day_entries = EmotionEntry.objects.filter(created_at__date=date)
        
        counts = {
            'sunny': 0,
            'cloudy': 0,
            'rainy': 0,
            'storm': 0
        }
        
        for e in day_entries:
            if e.emotion_type in counts:
                counts[e.emotion_type] += 1
                
        history_data.append({
            "date": date_str,
            "sunny": counts['sunny'],
            "cloudy": counts['cloudy'],
            "rainy": counts['rainy'],
            "storm": counts['storm']
        })
        
    return JsonResponse(history_data, safe=False)
