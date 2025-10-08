const messages = {
  en: {
    auth: {
      noToken: 'No authentication token provided',
      invalidToken: 'Invalid authentication token',
      unauthorized: 'Unauthorized',
      noPermission: 'You do not have permission to access this resource',
      loginSuccess: 'Login successful',
      loginFailed: 'Login failed. Please check your credentials',
      userNotFound: 'User not found',
      invalidCredentials: 'Invalid username or password',
      userExists: 'Username already exists',
      registrationSuccess: 'Registration successful',
      registrationFailed: 'Registration failed'
    },
    validation: {
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      invalidPhone: 'Invalid phone number',
      minLength: 'Minimum length is {{min}} characters',
      maxLength: 'Maximum length is {{max}} characters'
    },
    errors: {
      serverError: 'Internal server error',
      notFound: 'Resource not found',
      badRequest: 'Bad request',
      databaseError: 'Database error occurred',
      operationFailed: 'Operation failed'
    },
    success: {
      created: 'Created successfully',
      updated: 'Updated successfully',
      deleted: 'Deleted successfully',
      operationSuccess: 'Operation completed successfully'
    }
  },
  ar: {
    auth: {
      noToken: 'لا يوجد رمز مصادقة',
      invalidToken: 'رمز مصادقة غير صالح',
      unauthorized: 'غير مصرح',
      noPermission: 'ليس لديك صلاحية للوصول لهذا المورد',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      loginFailed: 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد',
      userNotFound: 'المستخدم غير موجود',
      invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
      userExists: 'اسم المستخدم موجود بالفعل',
      registrationSuccess: 'تم التسجيل بنجاح',
      registrationFailed: 'فشل التسجيل'
    },
    validation: {
      required: 'هذا الحقل مطلوب',
      invalidEmail: 'عنوان البريد الإلكتروني غير صالح',
      invalidPhone: 'رقم الهاتف غير صالح',
      minLength: 'الحد الأدنى {{min}} أحرف',
      maxLength: 'الحد الأقصى {{max}} حرف'
    },
    errors: {
      serverError: 'خطأ في الخادم الداخلي',
      notFound: 'المورد غير موجود',
      badRequest: 'طلب غير صحيح',
      databaseError: 'حدث خطأ في قاعدة البيانات',
      operationFailed: 'فشلت العملية'
    },
    success: {
      created: 'تم الإنشاء بنجاح',
      updated: 'تم التحديث بنجاح',
      deleted: 'تم الحذف بنجاح',
      operationSuccess: 'تمت العملية بنجاح'
    }
  }
};

const getMessage = (lang, category, key, params = {}) => {
  const language = lang === 'ar' ? 'ar' : 'en';
  let message = messages[language]?.[category]?.[key] || messages.en[category]?.[key] || key;
  
  // Replace placeholders with params
  Object.keys(params).forEach(param => {
    message = message.replace(`{{${param}}}`, params[param]);
  });
  
  return message;
};

module.exports = { messages, getMessage };
