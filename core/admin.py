from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Wallet

class CustomUserAdmin(UserAdmin):
    # Fields to display in the user list
    list_display = ('firebase_uid', 'email', 'display_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('firebase_uid', 'email', 'display_name')
    ordering = ('firebase_uid',)
    
    # Fields shown when editing a user
    fieldsets = (
        (None, {'fields': ('firebase_uid',)}),
        (_('Personal info'), {'fields': ('display_name', 'email')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields shown when creating a user (for admin purposes)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('firebase_uid', 'email', 'display_name', 'password1', 'password2'),
        }),
    )
    
    # For compatibility with UserAdmin's expected fields
    def get_fieldsets(self, request, obj=None):
        if not obj:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'address', 'created_at')
    search_fields = ('user__firebase_uid', 'user__email', 'address')
    readonly_fields = ('created_at', 'last_updated')
    list_filter = ('created_at',)
    raw_id_fields = ('user',)

admin.site.register(User, CustomUserAdmin)
admin.site.register(Wallet, WalletAdmin)