from django import forms
from .models import Book, Category

class BookCreateForm(forms.ModelForm):
    class Meta:
        model = Book
        fields = ['title', 'author', 'category', 'description', 'price', 'condition', 'cover_image']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }

class BookSearchForm(forms.Form):
    keyword = forms.CharField(label='搜索书籍', max_length=100, required=False)
    category = forms.ModelChoiceField(queryset=Category.objects.all(), required=False, empty_label="全部分类")