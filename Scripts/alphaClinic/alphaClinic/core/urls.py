from django.urls import path
from alphaClinic.core.views import home


app_name='core'
urlpatterns = [
path("", home, name='home'),
# path("contato/", contact, name='contact')
]
