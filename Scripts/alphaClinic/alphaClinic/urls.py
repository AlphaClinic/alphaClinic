from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', include('alphaClinic.core.urls', namespace='core')),
    path('admin/', admin.site.urls),
]