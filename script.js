// === MENU ===
    var menuBtn = document.getElementById('menuBtn');
    var navLinks = document.getElementById('navLinks');

    menuBtn.addEventListener('click', function () {
      navLinks.classList.toggle('active');
      menuBtn.setAttribute('aria-expanded', navLinks.classList.contains('active') ? 'true' : 'false');
    });

    var links = navLinks.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        navLinks.classList.remove('active');
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        navLinks.classList.remove('active');
      }
    });

    // === BMI KALKULYATOR ===
    function hisobla() {
      var boiy = parseFloat(document.getElementById('bmiBoiy').value);
      var vazn = parseFloat(document.getElementById('bmiVazn').value);
      var yosh = parseFloat(document.getElementById('bmiYosh').value);
      var jins = document.getElementById('bmiJins').value;
      var score = document.getElementById('bmiScore');
      var badge = document.getElementById('bmiBadge');
      var suv = document.getElementById('suvNormasi');

      if (!boiy || !vazn || !yosh || boiy <= 0 || vazn <= 0 || yosh <= 0) {
        score.textContent = '--';
        badge.textContent = 'Ma\'lumot kiritilmagan';
        suv.textContent = '-- Litr';
        return;
      }

      var metr = boiy / 100;
      var bmi = vazn / (metr * metr);
      score.textContent = bmi.toFixed(1);

      if (bmi < 18.5) {
        badge.textContent = 'Kam vazn';
        badge.style.backgroundColor = '#f59e0b';
      } else if (bmi < 25) {
        badge.textContent = 'Me\'yorda (Sog\'lom)';
        badge.style.backgroundColor = 'rgba(255,255,255,0.2)';
      } else if (bmi < 30) {
        badge.textContent = 'Ortiqcha vazn';
        badge.style.backgroundColor = '#f97316';
      } else {
        badge.textContent = 'Semizlik';
        badge.style.backgroundColor = '#ef4444';
      }

      var litr;
      if (jins === 'Ayol') {
        litr = vazn * 0.033;
      } else {
        litr = vazn * 0.04;
      }
      suv.textContent = litr.toFixed(1) + ' Litr';
    }

    document.getElementById('bmiBoiy').addEventListener('input', hisobla);
    document.getElementById('bmiVazn').addEventListener('input', hisobla);
    document.getElementById('bmiYosh').addEventListener('input', hisobla);
    document.getElementById('bmiJins').addEventListener('change', hisobla);

    // === FORMA YUBORISH ===
// Sayt server orqali ochilsa — o'sha manzil, Live Server yoki fayldan ochilsa — lokal backend
var API_URL = (location.protocol === 'file:' || location.port === '5500' || location.port === '5501')
  ? 'http://localhost:3000'
  : '';
document.getElementById('formaBtn').addEventListener('click', async function () {
  var ism = document.getElementById('formaIsm').value.trim();
  var tel = document.getElementById('formaTel').value.trim();
  var maqsad = document.getElementById('formaMaqsad').value;
  var xato = document.getElementById('formaXato');
  var btn = document.getElementById('formaBtn');

  if (!ism) {
    xato.style.color = '#fca5a5';
    xato.textContent = 'Iltimos, ismingizni kiriting!';
    return;
  }

  if (!tel) {
    xato.style.color = '#fca5a5';
    xato.textContent = 'Iltimos, telefon raqamingizni kiriting!';
    return;
  }

  if (tel.replace(/\D/g, '').length < 9) {
    xato.style.color = '#fca5a5';
    xato.textContent = 'Telefon raqami noto\'g\'ri!';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Yuborilmoqda...';
  xato.textContent = '';

  try {
    var response = await fetch(API_URL + '/api/konsultatsiya', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ism: ism,
        tel: tel,
        maqsad: maqsad
      })
    });

    var data = await response.json();

    if (data.success) {
      xato.style.color = '#34d399';
      xato.textContent = 'Rahmat! Arizangiz yuborildi. Tez orada siz bilan bog\'lanamiz.';

      document.getElementById('formaIsm').value = '';
      document.getElementById('formaTel').value = '';
      document.getElementById('formaMaqsad').selectedIndex = 0;
    } else {
      xato.style.color = '#fca5a5';
      xato.textContent = data.message || 'Xatolik yuz berdi.';
    }

  } catch (error) {
    console.error(error);
    xato.style.color = '#fca5a5';
    xato.textContent = 'Server bilan bog\'lanib bo\'lmadi.';
  }

  btn.disabled = false;
  btn.textContent = 'Arizani Yuborish';
});

// === SCROLL ANIMATSIYASI ===
var revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(function (el) { observer.observe(el); });
} else {
  revealEls.forEach(function (el) { el.classList.add('visible'); });
}
