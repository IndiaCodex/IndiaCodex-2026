from django.urls import path
from . import views

urlpatterns=[

path("",views.home),

path("client/",views.client),

path("freelancer/",views.freelancer),

path("submit/<int:id>/",views.submit),
path("approve/<int:id>/",views.approve),

path("create/",views.create),
path("project/<int:id>/", views.project_detail, name="project_detail"),



path("agent/",views.agent),
path("dispute/<int:id>/",views.dispute),
path("release/<int:id>/",views.release),
path("refund/<int:id>/",views.refund),
path("project/<int:id>/",views.project_detail),

]