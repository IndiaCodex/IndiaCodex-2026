from django.shortcuts import render,redirect
from .models import Project

def home(request):
    return render(request,"index.html")

def client(request):

    projects=Project.objects.all()

    total_projects=projects.count()

    total_amount=sum([x.budget for x in projects])

    pending=projects.filter(status="Locked").count()

    return render(request,"client.html",{

        "projects":projects,

        "total_projects":total_projects,

        "total_amount":total_amount,

        "pending":pending,

    })

def create(request):

    if request.method == "POST":

        Project.objects.create(

            title=request.POST['title'],
            description=request.POST['description'],
            budget=request.POST['budget'],
            deadline=request.POST['deadline'],
            client=request.POST.get('client'),
freelancer=request.POST.get('freelancer'),
pin=request.POST.get('pin'),

        )

        return redirect("/client/")

    return render(request,"create.html")



def freelancer(request):

    projects=Project.objects.all()

    return render(request,"freelancer.html",{

        "projects":projects

    })


def submit(request,id):

    project=Project.objects.get(id=id)

    if request.method=="POST":

        project.preview=request.FILES['preview']

        project.status="Submitted"

        project.save()

        return redirect("/freelancer/")

    return render(request,"submit.html")


def approve(request, id):
    project = Project.objects.get(id=id)
    project.status = "Released"
    project.save()

    return redirect("/client/")


def agent(request):

    projects=Project.objects.filter(status="Disputed")

    return render(request,"agent.html",{

        "projects":projects

    })


def dispute(request,id):

    project=Project.objects.get(id=id)

    project.status="Disputed"

    project.save()

    return redirect("/agent/")


def release(request,id):

    project=Project.objects.get(id=id)

    project.status="Released"

    project.save()

    return redirect("/agent/")


def refund(request,id):

    project=Project.objects.get(id=id)

    project.status="Refunded"

    project.save()

    return redirect("/agent/")


def project_detail(request,id):

    project=Project.objects.get(id=id)

    return render(request,"project_detail.html",{

        "project":project

    })

from django.shortcuts import get_object_or_404

def project_detail(request, id):
    project = get_object_or_404(Project, id=id)
    return render(request, "project_detail.html", {"project": project})