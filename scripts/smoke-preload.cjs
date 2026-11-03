// يسجل الأخطاء غير الملتقطة مع الـ stack كاملاً أثناء فحص الواجهة
window.addEventListener('error', (e) => {
  console.error('[STACK] ' + (e.error && e.error.stack ? e.error.stack : e.message));
});
