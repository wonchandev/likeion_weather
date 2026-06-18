from django.db import models

class EmotionEntry(models.Model):
    EMOTION_CHOICES = [
        ('sunny', 'Sunny'),
        ('cloudy', 'Cloudy'),
        ('rainy', 'Rainy'),
        ('storm', 'Storm'),
    ]

    session_id = models.CharField(max_length=100, db_index=True)
    region = models.CharField(max_length=50, db_index=True)
    emotion_type = models.CharField(max_length=10, choices=EMOTION_CHOICES)
    comment = models.CharField(max_length=50, blank=True, default='')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.region}] {self.emotion_type} by {self.session_id[:8]} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class WeatherComparison(models.Model):
    region = models.CharField(max_length=50, db_index=True)
    date = models.DateField(db_index=True)
    real_weather = models.CharField(max_length=20)  # 'sunny', 'cloudy', 'rainy', 'storm'
    real_temp = models.FloatField(null=True, blank=True)  # in Celsius
    dominant_emotion = models.CharField(max_length=20)  # 'sunny', 'cloudy', 'rainy', 'storm'
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('region', 'date')

    def __str__(self):
        return f"[{self.date}] {self.region}: Real({self.real_weather}) vs Emotion({self.dominant_emotion})"
