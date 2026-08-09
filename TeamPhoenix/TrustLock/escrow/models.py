from django.db import models

class Project(models.Model):

    STATUS_CHOICES=[

('Locked','Locked'),

('Assigned','Assigned'),

('Submitted','Submitted'),

('Approved','Approved'),

('Disputed','Disputed'),

('Released','Released'),

('Refunded','Refunded'),

]

    title=models.CharField(max_length=200)
    description=models.TextField()
    budget=models.IntegerField()
    deadline=models.DateField()

    client=models.CharField(max_length=100,default="Recruiter")
    freelancer=models.CharField(max_length=100,default="Developer")

    preview=models.FileField(upload_to="preview/",blank=True,null=True)

    pin=models.CharField(max_length=6,default="123456")

    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default="Locked")

    created=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title