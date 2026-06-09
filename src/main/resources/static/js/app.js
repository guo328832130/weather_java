/**
 * 管理后台 SPA — 侧边栏导航 + 多页面
 */
(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════
   *  API 层
   * ═══════════════════════════════════════════════════════ */
  async function request(method, path, body) {
    var opts = { method: method, headers: { "Content-Type": "application/json" } };
    var token = localStorage.getItem("token");
    if (token) opts.headers["Authorization"] = "Bearer " + token;
    if (body) opts.body = JSON.stringify(body);
    var resp = await fetch(path, opts);
    var json = await resp.json();
    if (json.code === 401) { logout(); }
    return json;
  }

  var api = {
    register: function (u, p, c) { return request("POST", "/api/register", { username: u, password: p, confirm: c }); },
    login: async function (u, p) {
      var r = await request("POST", "/api/login", { username: u, password: p });
      if (r.code === 200 && r.data && r.data.token) {
        localStorage.setItem("token", r.data.token);
        localStorage.setItem("username", r.data.username);
      }
      return r;
    },
    logout: async function () {
      var r = await request("POST", "/api/logout");
      logout();
      return r;
    },
    user: function () { return request("GET", "/api/user"); },
    weather: function (params) {
      var qs = new URLSearchParams(params).toString();
      return request("GET", "/api/weather?" + qs);
    },
    homeWeather: function (count) { return request("GET", "/api/home-weather?count=" + (count || 5)); },
    products: function (params) {
      if (params) {
        return request("POST", "/api/products/search", params);
      }
      return request("GET", "/api/products");
    },
    createProduct: function (data) { return request("POST", "/api/products", data); },
    updateProduct: function (id, data) { return request("PUT", "/api/products/" + id, data); },
    deleteProduct: function (id) { return request("DELETE", "/api/products/" + id); },
    provinces: function () { return request("GET", "/api/provinces"); },
    cities: function (province) { return request("GET", "/api/cities?province=" + encodeURIComponent(province)); },
    districts: function (city) { return request("GET", "/api/districts?city=" + encodeURIComponent(city)); }
  };

  function logout() {
    localStorage.removeItem("token"); localStorage.removeItem("username");
    window.location.hash = "#login"; render("#login");
  }

  /* ═══════════════════════════════════════════════════════
   *  路由
   * ═══════════════════════════════════════════════════════ */
  var routes = {};
  var _after = {};

  function navigate(hash) {
    window.location.hash = hash;
  }

  function render(hash) {
    var appEl = document.getElementById("app");
    var topRight = document.getElementById("topbarRight");
    var titleEl = document.getElementById("topbarTitle");
    var username = localStorage.getItem("username");

    // 未登录 → 显示登录页
    if (!username) {
      document.body.classList.add("auth-page");
      if (topRight) topRight.innerHTML = "";
      if (titleEl) titleEl.textContent = "";
      var fn = routes[hash] || routes["#login"];
      if (fn) appEl.innerHTML = fn();
      var cb = _after[hash];
      if (cb) cb();
      highlightSidebar(hash);
      return;
    }

    // 已登录 → 显示后台布局
    document.body.classList.remove("auth-page");
    if (topRight) {
      topRight.innerHTML = '<span>👤 ' + username + '</span><a id="btnLogout" href="#">退出登录</a>';
      var logoutBtn = document.getElementById("btnLogout");
      if (logoutBtn) logoutBtn.onclick = function (e) { e.preventDefault(); api.logout(); };
    }

    var pageTitle = { "#dashboard": "首页", "#weather": "天气管理", "#products": "产品管理", "#product-new": "新增产品", "#product-edit": "编辑产品" };
    if (titleEl) titleEl.textContent = pageTitle[hash] || "管理后台";

    // 渲染侧边栏
    buildSidebar(hash);

    // 处理带参路由: #product-edit/7 → base=#product-edit, 参数在 hash 中
    var routeKey = hash;
    var routeMatch = hash.match(/^(#[a-z-]+)\/(\d+)$/);
    if (routeMatch) {
      routeKey = routeMatch[1];
      pageState.editProductId = parseInt(routeMatch[2]);
    } else {
      pageState.editProductId = null;
    }

    // 如果没有有效路由，跳转到仪表盘
    if (!routes[routeKey]) { navigate("#dashboard"); return; }

    var fn = routes[routeKey];
    if (fn) appEl.innerHTML = fn();
    var cb = _after[routeKey];
    if (cb) cb();
    highlightSidebar(hash);
  }

  window.addEventListener("hashchange", function () { render(window.location.hash); });

  /* ═══════════════════════════════════════════════════════
   *  侧边栏
   * ═══════════════════════════════════════════════════════ */
  function buildSidebar(activeHash) {
    var nav = document.getElementById("sidebarNav");
    if (!nav) return;
    var menus = [
      { id: "dashboard", icon: "🏠", label: "首页", hash: "#dashboard" },
      { id: "weather", icon: "🌤️", label: "天气管理", hash: "#weather" },
      { id: "products", icon: "📦", label: "产品管理", hash: "#products" }
    ];

    nav.innerHTML = menus.map(function (m) {
      return '<div class="menu-item" data-hash="' + m.hash + '">' +
        '<span class="menu-icon">' + m.icon + '</span>' +
        '<span class="menu-text">' + m.label + '</span></div>';
    }).join("");

    // 点击事件
    nav.querySelectorAll(".menu-item").forEach(function (el) {
      el.onclick = function () {
        var h = el.dataset.hash;
        if (el.classList.contains("open")) {
          el.classList.remove("open");
          var sub = el.nextElementSibling;
          if (sub && sub.classList.contains("submenu")) sub.classList.remove("show");
        }
        navigate(h);
      };
    });
  }

  function highlightSidebar(hash) {
    var nav = document.getElementById("sidebarNav");
    if (!nav) return;
    nav.querySelectorAll(".menu-item, .sub-item").forEach(function (el) {
      el.classList.remove("active");
    });
    // 子页面高亮父菜单
    if (hash === "#product-new") hash = "#products";
    var active = nav.querySelector('[data-hash="' + hash + '"]');
    if (active) active.classList.add("active");
  }

  // 侧边栏折叠
  window.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      var toggle = document.getElementById("menuToggle");
      var sidebar = document.getElementById("sidebar");
      if (toggle && sidebar) {
        toggle.onclick = function () { sidebar.classList.toggle("collapsed"); };
      }
    }, 100);
  });

  /* ═══════════════════════════════════════════════════════
   *  校验函数
   * ═══════════════════════════════════════════════════════ */
  function checkUsername(v) {
    if (!v) return "请输入账号";
    if (v.length < 8) return "账号长度不够，需要8位（当前 " + v.length + " 位）";
    if (v.length > 8) return "账号不能超过8位（当前 " + v.length + " 位）";
    if (!/[a-zA-Z]/.test(v)) return "账号必须包含字母";
    if (!/\d/.test(v)) return "账号必须包含数字";
    if (/[^a-zA-Z0-9]/.test(v)) return "账号只能包含字母和数字";
    return null;
  }

  function checkPassword(v) {
    if (!v) return "请输入密码";
    if (v.length < 5) return "密码长度不够，至少5位";
    if (!/[a-zA-Z]/.test(v)) return "密码必须包含字母";
    if (!/\d/.test(v)) return "密码必须包含数字";
    if (/[^a-zA-Z0-9]/.test(v)) return "密码只能包含字母和数字";
    return null;
  }

  function setState(el, state, msg) {
    var wrap = el.closest(".form-group");
    var fb = wrap ? wrap.querySelector(".feedback-msg") : null;
    el.classList.remove("is-valid", "is-invalid");
    if (fb) fb.textContent = "";
    if (state === "error") { el.classList.add("is-invalid"); if (fb) fb.textContent = msg; }
    else if (state === "success") { el.classList.add("is-valid"); if (fb) fb.textContent = msg || ""; }
  }

  function validateField(el, checkFn, successMsg) {
    var v = el.value;
    var err = checkFn(v);
    if (err) { setState(el, "error", err); return false; }
    setState(el, "success", successMsg || "✔️");
    return true;
  }

  /* ═══════════════════════════════════════════════════════
   *  登录页
   * ═══════════════════════════════════════════════════════ */
  routes["#login"] = function () {
    return '<div class="auth-center"><div class="auth-card card"><div class="card-body">' +
      '<h2>🔐 管理后台登录</h2>' +
      '<form id="loginForm"><div class="form-group">' +
      '<label>账号 <span style="font-weight:400;color:#9ca3af;font-size:12px;">（8位，字母+数字）</span></label>' +
      '<div><div class="input-wrap">' +
      '<input id="loginUser" type="text" placeholder="字母+数字组合，共8位" maxlength="8" autocomplete="off" autofocus>' +
      '<span class="char-count" id="loginUserCount">0/8</span></div>' +
      '<div class="feedback-msg"></div></div></div>' +
      '<div class="form-group">' +
      '<label>密码 <span style="font-weight:400;color:#9ca3af;font-size:12px;">（至少5位，字母+数字）</span></label>' +
      '<div><div class="input-wrap">' +
      '<input id="loginPass" type="password" placeholder="字母+数字组合，至少5位" maxlength="30" autocomplete="off">' +
      '<button type="button" class="pwd-toggle" id="loginPwdToggle" title="显示/隐藏密码">👁️</button>' +
      '<span class="char-count" id="loginPassCount">0/5+</span></div>' +
      '<div class="feedback-msg"></div></div></div>' +
      '<button type="submit" class="btn btn-primary" id="loginBtn" style="width:100%">登录</button></form>' +
      '<div id="loginMsg" style="margin-top:12px;"></div>' +
      '<p class="link">还没有账号？<a id="toRegister" href="#">立即注册</a></p>' +
      '</div></div></div>';
  };

  _after["#login"] = function () {
    var form = document.getElementById("loginForm");
    var user = document.getElementById("loginUser");
    var pass = document.getElementById("loginPass");
    var btn = document.getElementById("loginBtn");
    var msg = document.getElementById("loginMsg");
    if (!form) return;

    var pwdToggle = document.getElementById("loginPwdToggle");
    var pwdVisible = false;
    if (pwdToggle) pwdToggle.addEventListener("click", function () {
      pwdVisible = !pwdVisible;
      pass.type = pwdVisible ? "text" : "password";
      pwdToggle.textContent = pwdVisible ? "🙈" : "👁️";
    });

    var toReg = document.getElementById("toRegister");
    if (toReg) toReg.onclick = function (e) { e.preventDefault(); navigate("#register"); render("#register"); };

    user.addEventListener("input", function () {
      document.getElementById("loginUserCount").textContent = user.value.length + "/8";
      if (user.value.length > 0) validateField(user, checkUsername, "✔️ 格式正确");
      else setState(user, null, "");
    });
    pass.addEventListener("input", function () {
      document.getElementById("loginPassCount").textContent = pass.value.length + "/5+";
      if (pass.value.length > 0) validateField(pass, checkPassword, "✔️ 格式正确");
      else setState(pass, null, "");
    });

    form.onsubmit = async function (e) {
      e.preventDefault();
      var okU = validateField(user, checkUsername, "✔️ 格式正确");
      var okP = validateField(pass, checkPassword, "✔️ 格式正确");
      if (!okU || !okP) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 登录中...'; msg.innerHTML = "";
      try {
        var r = await api.login(user.value.trim(), pass.value);
        btn.disabled = false; btn.innerHTML = "登录";
        if (r.code === 200) {
          msg.innerHTML = '<div class="alert alert-success">登录成功，正在跳转...</div>';
          setTimeout(function () { navigate("#dashboard"); render("#dashboard"); }, 500);
        } else {
          msg.innerHTML = '<div class="alert alert-danger">' + (r.message || "未知错误") + '</div>';
        }
      } catch (err) {
        btn.disabled = false; btn.innerHTML = "登录";
        msg.innerHTML = '<div class="alert alert-danger">网络请求失败，请确认服务已启动</div>';
      }
    };
  };

  /* ═══════════════════════════════════════════════════════
   *  注册页
   * ═══════════════════════════════════════════════════════ */
  routes["#register"] = function () {
    return '<div class="auth-center"><div class="auth-card card"><div class="card-body">' +
      '<h2>📝 用户注册</h2>' +
      '<form id="regForm">' +
      '<div class="form-group"><label>账号 <span style="font-weight:400;color:#9ca3af;font-size:12px;">（8位，字母+数字）</span></label>' +
      '<div><div class="input-wrap"><input id="regUser" type="text" placeholder="字母+数字组合，共8位" maxlength="8" autocomplete="off" autofocus>' +
      '<span class="char-count" id="regUserCount">0/8</span></div><div class="feedback-msg"></div></div>' +
      '<div class="rules-hint" id="regUserRules">' +
      '<span data-rule="length">🔴 至少 8 位</span>' +
      '<span data-rule="letter">🔴 包含字母</span>' +
      '<span data-rule="digit">🔴 包含数字</span></div></div>' +
      '<div class="form-group"><label>密码 <span style="font-weight:400;color:#9ca3af;font-size:12px;">（至少5位，字母+数字）</span></label>' +
      '<div><div class="input-wrap"><input id="regPass" type="password" placeholder="字母+数字组合，至少5位" maxlength="30" autocomplete="off">' +
      '<span class="char-count" id="regPassCount">0/5+</span></div><div class="feedback-msg"></div></div>' +
      '<div class="rules-hint" id="regPassRules">' +
      '<span data-rule="length">🔴 至少 5 位</span>' +
      '<span data-rule="letter">🔴 包含字母</span>' +
      '<span data-rule="digit">🔴 包含数字</span></div></div>' +
      '<div class="form-group"><label>确认密码</label>' +
      '<div><div class="input-wrap"><input id="regConfirm" type="password" placeholder="再次输入密码" maxlength="30" autocomplete="off">' +
      '<span class="char-count" id="regConfirmCount">0/5+</span></div><div class="feedback-msg"></div></div></div>' +
      '<button type="submit" class="btn btn-primary" id="regBtn" style="width:100%">注册</button></form>' +
      '<div id="regMsg" style="margin-top:12px;"></div>' +
      '<p class="link">已有账号？<a id="toLogin" href="#">立即登录</a></p>' +
      '</div></div></div>';
  };

  _after["#register"] = function () {
    var form = document.getElementById("regForm");
    var user = document.getElementById("regUser"), pass = document.getElementById("regPass");
    var confirm = document.getElementById("regConfirm"), btn = document.getElementById("regBtn");
    var msg = document.getElementById("regMsg");
    if (!form) return;
    var userRules = document.querySelectorAll("#regUserRules span");
    var passRules = document.querySelectorAll("#regPassRules span");

    document.getElementById("toLogin").onclick = function (e) { e.preventDefault(); navigate("#login"); render("#login"); };

    function updateRules(rules, v, checks) {
      rules.forEach(function (el) {
        var rule = el.dataset.rule;
        if (checks[rule](v)) el.innerHTML = el.innerHTML.replace("🔴", "🟢");
        else el.innerHTML = el.innerHTML.replace("🟢", "🔴");
      });
    }
    var userChecks = { length: function (v) { return v.length === 8; }, letter: function (v) { return /[a-zA-Z]/.test(v); }, digit: function (v) { return /\d/.test(v); } };
    var passChecks = { length: function (v) { return v.length >= 5; }, letter: function (v) { return /[a-zA-Z]/.test(v); }, digit: function (v) { return /\d/.test(v); } };

    user.addEventListener("input", function () {
      document.getElementById("regUserCount").textContent = user.value.length + "/8";
      updateRules(userRules, user.value, userChecks);
      if (user.value.length > 0) validateField(user, checkUsername, "✔️ 格式正确");
      else setState(user, null, "");
    });
    pass.addEventListener("input", function () {
      document.getElementById("regPassCount").textContent = pass.value.length + "/5+";
      updateRules(passRules, pass.value, passChecks);
      if (pass.value.length > 0) validateField(pass, checkPassword, "✔️ 格式正确");
      else setState(pass, null, "");
      if (confirm.value.length > 0) validateConfirm();
    });
    function validateConfirm() {
      if (confirm.value.length === 0) { setState(confirm, null, ""); return true; }
      if (confirm.value.length < 5) { setState(confirm, "error", "密码长度不够，至少5位"); return false; }
      if (confirm.value !== pass.value) { setState(confirm, "error", "两次密码不一致"); return false; }
      setState(confirm, "success", "✔️ 密码一致"); return true;
    }
    confirm.addEventListener("input", function () {
      document.getElementById("regConfirmCount").textContent = confirm.value.length + "/5+";
      validateConfirm();
    });
    form.onsubmit = async function (e) {
      e.preventDefault();
      var okU = validateField(user, checkUsername, "✔️ 格式正确");
      var okP = validateField(pass, checkPassword, "✔️ 格式正确");
      var okC = validateConfirm();
      if (!okU || !okP || !okC) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 注册中...'; msg.innerHTML = "";
      try {
        var r = await api.register(user.value.trim(), pass.value, confirm.value);
        btn.disabled = false; btn.innerHTML = "注册";
        if (r.code === 200) {
          msg.innerHTML = '<div class="alert alert-success">' + r.message + '，即将跳转...</div>';
          setTimeout(function () { navigate("#login"); render("#login"); }, 1500);
        } else { msg.innerHTML = '<div class="alert alert-danger">' + r.message + '</div>'; }
      } catch (err) {
        btn.disabled = false; btn.innerHTML = "注册";
        msg.innerHTML = '<div class="alert alert-danger">网络请求失败</div>';
      }
    };
  };

  /* ═══════════════════════════════════════════════════════
   *  首页（仪表盘）
   * ═══════════════════════════════════════════════════════ */
  routes["#dashboard"] = function () {
    return '<div>' +
      '<div class="stats-row">' +
        '<div class="stat-card"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-value" id="productCount">-</div><div class="stat-label">产品总数</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon">🌤️</div><div class="stat-info"><div class="stat-value">13</div><div class="stat-label">武汉区域数</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon">👤</div><div class="stat-info"><div class="stat-value" id="userCount">-</div><div class="stat-label">当前在线</div></div></div>' +
      '</div>' +
      '<div class="card"><div class="card-header">' +
        '<span>🏙️ 武汉市随机区域天气</span>' +
        '<button class="btn btn-primary btn-sm" id="btnRefreshWeather">🔄 随机刷新</button>' +
      '</div><div class="card-body"><div class="weather-grid" id="weatherGrid">' +
        '<div class="empty"><div class="spinner"></div><p>加载天气数据中...</p></div>' +
      '</div></div></div></div>';
  };

  _after["#dashboard"] = function () {
    // 加载统计
    api.products().then(function (r) { if (r.code === 200) document.getElementById("productCount").textContent = r.data.total || 0; });
    api.user().then(function (r) { if (r.code === 200) document.getElementById("userCount").textContent = 1; });

    // 加载随机天气
    loadHomeWeather();
    document.getElementById("btnRefreshWeather").onclick = loadHomeWeather;
  };

  function loadHomeWeather() {
    var grid = document.getElementById("weatherGrid");
    if (!grid) return;
    grid.innerHTML = '<div class="empty"><div class="spinner"></div><p>加载中...</p></div>';
    api.homeWeather(5).then(function (r) {
      if (r.code !== 200 || !r.data) { grid.innerHTML = '<div class="empty"><p>加载失败</p></div>'; return; }
      var data = r.data.weather_data || [];
      if (!data.length) { grid.innerHTML = '<div class="empty"><p>暂无数据</p></div>'; return; }
      grid.innerHTML = data.map(function (w, i) {
        var icon = weatherEmoji(w.weather);
        var animateClass = ["wc-fade-1", "wc-fade-2", "wc-fade-3", "wc-fade-4", "wc-fade-5"][i];
        return '<div class="weather-card ' + animateClass + '">' +
          '<div class="wc-header"><span class="wc-name">' + w.name + '</span><span class="wc-icon">' + icon + '</span></div>' +
          '<div class="wc-body"><span class="wc-temp">' + (typeof w.temp_max === 'number' ? w.temp_max.toFixed(0) + '°' : w.temp_max || '--°') + '</span>' +
          '<span class="wc-desc">' + (w.weather || '未知') + '</span></div>' +
          '<div class="wc-details">' +
          '<span class="wc-detail">最低 <b>' + (typeof w.temp_min === 'number' ? w.temp_min.toFixed(0) + '°C' : w.temp_min || '--') + '</b></span>' +
          '<span class="wc-detail">湿度 <b>' + (w.humidity !== '--' ? w.humidity + '%' : '--') + '</b></span>' +
          '<span class="wc-detail">风力 <b>' + (w.wind_speed || '--') + '</b></span>' +
          '</div></div>';
      }).join("");
    }).catch(function () { grid.innerHTML = '<div class="empty"><p>网络错误</p></div>'; });
  }

  function weatherEmoji(text) {
    if (!text) return "🌤️";
    if (/晴/.test(text)) return "☀️";
    if (/云/.test(text)) return "⛅";
    if (/雨|阵雨/.test(text)) return "🌧️";
    if (/雪/.test(text)) return "❄️";
    if (/阴/.test(text)) return "☁️";
    if (/雾|霾/.test(text)) return "🌫️";
    if (/雷/.test(text)) return "⛈️";
    if (/暴/.test(text)) return "⛈️";
    return "🌤️";
  }

  /* ═══════════════════════════════════════════════════════
   *  天气管理页
   * ═══════════════════════════════════════════════════════ */
  routes["#weather"] = function () {
    return '<div class="card"><div class="card-header" style="background:#1890ff;color:#fff;">🔍 天气查询</div><div class="card-body">' +
      '<div id="queryForm" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">' +
      '<div class="form-group" style="flex:1;min-width:180px;"><label>省份</label><select id="selProvince"><option value="">加载中...</option></select></div>' +
      '<div class="form-group" style="flex:1;min-width:180px;"><label>城市</label><select id="selCity" disabled><option value="">请先选择省份</option></select></div>' +
      '<div class="form-group" style="flex:1;min-width:180px;"><label>区县</label><select id="selDistrict" disabled><option value="">请先选择城市</option></select></div>' +
      '<div class="form-group" style="min-width:120px;"><button class="btn btn-primary" id="btnQuery">查询天气</button></div></div></div></div>' +
      '<div class="card"><div class="card-header"><span id="resultTitle">🌤️ 天气结果</span><span style="font-weight:400;font-size:13px;color:#9ca3af;" id="resultCount"></span></div>' +
      '<div class="card-body" id="resultBody" style="padding:0;"><div class="empty"><p>⏳ 正在加载武汉各区天气...</p></div></div></div>';
  };

  _after["#weather"] = function () {
    var selP = document.getElementById("selProvince"), selC = document.getElementById("selCity");
    var selD = document.getElementById("selDistrict"), btnQ = document.getElementById("btnQuery");

    api.provinces().then(function (r) {
      if (r.code === 200) selP.innerHTML = '<option value="">-- 选择省份 --</option>' +
        r.data.provinces.map(function (p) { return '<option value="' + p.name + '">' + p.name + '</option>'; }).join("");
    }).catch(function () { selP.innerHTML = '<option value="">加载失败</option>'; });

    selP.onchange = async function () {
      selC.innerHTML = '<option value="">加载中...</option>'; selC.disabled = !selP.value;
      selD.innerHTML = '<option value="">请先选择城市</option>'; selD.disabled = true;
      if (!selP.value) return;
      try {
        var r = await api.cities(selP.value);
        if (r.code === 200) selC.innerHTML = '<option value="">-- 选择城市 --</option>' +
          r.data.cities.map(function (c) { return '<option value="' + c.name + '" data-hasd="' + (c.has_districts || false) + '">' + c.name + '</option>'; }).join("");
      } catch (e) { selC.innerHTML = '<option value="">加载失败</option>'; }
    };
    selC.onchange = async function () {
      selD.innerHTML = '<option value="">请先选择城市</option>'; selD.disabled = true;
      if (!selC.value) return;
      var opt = selC.selectedOptions[0];
      if (opt.dataset.hasd !== "true") { selD.innerHTML = '<option value="">该城市无区县数据</option>'; return; }
      selD.innerHTML = '<option value="">加载中...</option>'; selD.disabled = false;
      try {
        var r = await api.districts(selC.value);
        if (r.code === 200) selD.innerHTML = '<option value="">-- 选择区县（可选）--</option>' +
          r.data.districts.map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join("");
      } catch (e) { selD.innerHTML = '<option value="">加载失败</option>'; }
    };
    btnQ.onclick = doQuery;

    async function doQuery() {
      var params = {};
      if (selP.value) params.province = selP.value;
      if (selC.value) params.city = selC.value;
      if (selD.value) params.district = selD.value;
      var body = document.getElementById("resultBody");
      body.innerHTML = '<div class="empty"><div class="spinner"></div><p>查询中...</p></div>';
      try { var r = await api.weather(params); } catch (e) { body.innerHTML = '<div class="empty"><p>网络请求失败</p></div>'; return; }
      var title = document.getElementById("resultTitle"), count = document.getElementById("resultCount");
      if (r.code !== 200) { if (title) title.textContent = "🌤️ 天气结果"; if (count) count.textContent = ""; body.innerHTML = '<div class="empty"><p>' + (r.message || "未知错误") + '</p></div>'; return; }
      var data = r.data && r.data.weather_data, info = r.data && r.data.query_info;
      if (title && info) title.textContent = "🌤️ " + info.name + " 天气";
      if (count && r.data) count.textContent = "（共 " + (r.data.total || 0) + " 条）";
      if (!data || !data.length) { body.innerHTML = '<div class="empty"><p>暂无天气数据</p></div>'; return; }
      body.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
        '<th>#</th><th>地区</th><th>是否晴天</th><th>天气</th><th>湿度</th><th>气温范围</th><th>风力</th><th>时间</th></tr></thead><tbody>' +
        data.map(function (w, i) {
          var now = new Date(), ts = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
          return '<tr><td>' + (i+1) + '</td><td><strong>' + (w.name||'未知') + '</strong></td>' +
            '<td><span class="badge ' + (w.is_sunny?'badge-success':'badge-secondary') + '">' + (w.is_sunny?'☀️ 晴天':'☁️ 非晴天') + '</span></td>' +
            '<td>' + weatherEmoji(w.weather) + ' ' + (w.weather||'未知') + '</td>' +
            '<td>' + (typeof w.humidity==='number'?w.humidity+'%<div class="progress"><div class="progress-bar" style="width:'+Math.min(100,w.humidity)+'%"></div></div>':(w.humidity||'--')) + '</td>' +
            '<td><span style="color:#ff4d4f;font-weight:600;">'+(w.temp_max||'--')+'°C</span> / <span style="color:#1890ff;font-weight:600;">'+(w.temp_min||'--')+'°C</span></td>' +
            '<td>'+(w.wind_speed||'--')+' km/h</td><td style="font-size:12px;color:#9ca3af;">'+ts+'</td></tr>';
        }).join("") + '</tbody></table></div>';
    }
    doQuery();
  };

  /* ── 页面状态管理 ────────────────────────── */
  var pageState = {};

  /* ═══════════════════════════════════════════════════════
   *  产品管理页
   * ═══════════════════════════════════════════════════════ */
  routes["#products"] = function () {
    return '<div class="card"><div class="card-body">' +
      // 筛选区域
      '<div class="filter-area" style="background:#f9fafb;padding:20px 24px;border-radius:10px;margin-bottom:20px;border:1px solid #eee;">' +
        // 始终可见行
        '<div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;">' +
          '<div class="form-group" style="flex:1;min-width:180px;margin:0;"><label>产品名称</label><input type="text" id="filterProdName" placeholder="请输入产品名称"></div>' +
          '<div class="form-group" style="flex:1;min-width:180px;margin:0;"><label>产品编号</label><input type="text" id="filterProdCode" placeholder="请输入产品编号"></div>' +
          '<div class="form-group" style="flex:1.4;min-width:240px;margin:0;"><label>创建时间</label><div style="display:flex;align-items:center;gap:6px;">' +
            '<input type="text" id="filterStartDate" placeholder="开始日期" style="flex:1;"><span style="color:#999;">—</span><input type="text" id="filterEndDate" placeholder="结束日期" style="flex:1;">' +
          '</div></div>' +
          '<div style="display:flex;gap:8px;flex-shrink:0;padding-bottom:1px;">' +
            '<button class="btn btn-primary" id="btnSearchProd" style="padding:9px 20px;">查询</button>' +
            '<button class="btn btn-outline" id="btnResetProd" style="padding:9px 20px;">重置</button>' +
            '<button class="btn btn-outline" id="btnExpandProd" style="padding:7px 14px;font-size:12px;">展开 ▼</button>' +
          '</div>' +
        '</div>' +
        // 可折叠行
        '<div id="filterExtraRow" style="display:none;align-items:flex-end;gap:16px;flex-wrap:wrap;padding-top:16px;margin-top:16px;border-top:1px dashed #e0e0e0;">' +
          '<div class="form-group" style="flex:0.8;min-width:140px;margin:0;"><label>培训类型</label><select id="filterTrainType"><option value="">请选择</option><option value="集中培训">集中培训</option><option value="在线学习">在线学习</option><option value="混合培训">混合培训</option></select></div>' +
          '<div class="form-group" style="flex:0.8;min-width:140px;margin:0;"><label>培训模式</label><select id="filterTrainMode"><option value="">请选择</option><option value="线上">线上</option><option value="线下">线下</option><option value="线上+线下">线上+线下</option></select></div>' +
          '<div class="form-group" style="flex:1;min-width:160px;margin:0;"><label>培训主题</label><select id="filterTrainSubject"><option value="">请选择</option><option value="校验科研">校验科研</option><option value="课堂教学">课堂教学</option><option value="中考高考">中考高考</option><option value="班级管理">班级管理</option><option value="名校参访">名校参访</option><option value="跟岗实践">跟岗实践</option><option value="师德党政">师德党政</option><option value="幼教专区">幼教专区</option><option value="教育管理">教育管理</option><option value="无尽建设">无尽建设</option><option value="人工智能">人工智能</option><option value="课题研究">课题研究</option></select></div>' +
          '<div class="form-group" style="flex:0.7;min-width:130px;margin:0;"><label>适用学段</label><select id="filterGrade"><option value="">请选择</option><option value="幼儿园">幼儿园</option><option value="小学">小学</option><option value="初中">初中</option><option value="高中">高中</option></select></div>' +
          '<div class="form-group" style="flex:0.7;min-width:130px;margin:0;"><label>适用学科</label><select id="filterSubject"><option value="">请选择</option><option value="语文">语文</option><option value="数学">数学</option><option value="英语">英语</option><option value="信息技术">信息技术</option><option value="综合">综合</option></select></div>' +
          '<div class="form-group" style="flex:0.7;min-width:130px;margin:0;"><label>适用岗位</label><select id="filterPosition"><option value="">请选择</option><option value="校园长">校园长</option><option value="中层干部">中层干部</option><option value="教师">教师</option><option value="班主任">班主任</option></select></div>' +
          '<div class="form-group" style="flex:1;min-width:160px;margin:0;"><label>培训对象</label><input type="text" id="filterTrainTarget" placeholder="请输入培训对象"></div>' +
        '</div>' +
      '</div>' +
      // 工具栏
      '<div class="table-toolbar" style="margin-bottom:16px;">' +
        '<div class="toolbar-left" style="font-size:14px;color:#666;"><span id="productTotal">共 0 条</span></div>' +
        '<div class="toolbar-right" style="display:flex;gap:10px;">' +
          '<button class="btn btn-outline btn-sm" id="btnExportProd">📤 导出</button>' +
          '<button class="btn btn-primary btn-sm" id="btnNewProd">➕ 新建产品</button>' +
        '</div>' +
      '</div>' +
      // 表格
      '<div class="table-wrap"><table><thead><tr>' +
      '<th>产品信息 <span title="产品基本信息" style="cursor:pointer;color:#999;">ⓘ</span></th>' +
      '<th>培训对象 <span title="目标学员群体" style="cursor:pointer;color:#999;">ⓘ</span></th>' +
      '<th>培训主题</th><th>培训地点</th><th>课程学时</th><th>产品状态</th><th>创建时间</th><th>操作</th>' +
      '</tr></thead><tbody id="productTbody"><tr><td colspan="8"><div class="empty"><div class="spinner"></div><p>加载中...</p></div></td></tr></tbody></table></div>' +
      '<div class="pagination" id="productPagination"></div></div></div>' +
      '<div class="modal-overlay" id="productModal"><div class="modal-box" id="productModalContent"></div></div>';
  };

  _after["#products"] = function () {
    pageState.products = { all: [], filtered: [], page: 1 };

    api.products().then(function (r) {
      if (r.code !== 200) { document.getElementById("productTbody").innerHTML = '<tr><td colspan="8"><div class="empty"><p>加载失败</p></div></td></tr>'; return; }
      pageState.products.all = r.data.products || [];
      pageState.products.filtered = pageState.products.all.slice();
      document.getElementById("productTotal").textContent = '共 ' + pageState.products.all.length + ' 条';
      renderProductTable();
    });

    // 查询按钮
    document.getElementById("btnSearchProd").onclick = function () {
      applyProductFilter();  // 内部已异步调用 renderProductTable()
    };
    // 重置按钮
    document.getElementById("btnResetProd").onclick = function () {
      document.getElementById("filterProdName").value = "";
      document.getElementById("filterProdCode").value = "";
      document.getElementById("filterStartDate").value = "";
      document.getElementById("filterEndDate").value = "";
      document.getElementById("filterTrainType").value = "";
      document.getElementById("filterTrainMode").value = "";
      document.getElementById("filterTrainSubject").value = "";
      document.getElementById("filterGrade").value = "";
      document.getElementById("filterSubject").value = "";
      document.getElementById("filterPosition").value = "";
      document.getElementById("filterTrainTarget").value = "";
      // 重新加载全部数据
      var tbody = document.getElementById("productTbody");
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><div class="spinner"></div><p>加载中...</p></div></td></tr>';
      api.products().then(function (r) {
        if (r.code !== 200) { tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><p>加载失败</p></div></td></tr>'; return; }
        pageState.products.all = r.data.products || [];
        pageState.products.filtered = pageState.products.all.slice();
        pageState.products.page = 1;
        document.getElementById("productTotal").textContent = '共 ' + pageState.products.all.length + ' 条';
        renderProductTable();
      });
    };
    // 展开/收起按钮
    document.getElementById("btnExpandProd").onclick = function () {
      var row = document.getElementById("filterExtraRow");
      var btn = document.getElementById("btnExpandProd");
      if (row.style.display === "none" || row.style.display === "") {
        row.style.display = "flex";
        btn.innerHTML = "收起 ▲";
      } else {
        row.style.display = "none";
        btn.innerHTML = "展开 ▼";
      }
    };
    // 初始隐藏额外行
    document.getElementById("filterExtraRow").style.display = "none";
    // 导出按钮
    document.getElementById("btnExportProd").onclick = async function () {
      var btn = document.getElementById("btnExportProd");
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> 导出中...';

      try {
        var params = getFilterParams();
        var headers = { "Content-Type": "application/json" };
        var token = localStorage.getItem("token");
        if (token) headers["Authorization"] = "Bearer " + token;

        var resp = await fetch("/api/products/export", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(params)
        });

        if (!resp.ok) {
          throw new Error("导出失败 (" + resp.status + ")");
        }

        // 从 Content-Disposition 头提取文件名，优先使用 filename*
        var disposition = resp.headers.get("Content-Disposition");
        var filename = "产品导出.xlsx";
        if (disposition) {
          // 优先匹配 filename*=UTF-8''xxx
          var starMatch = disposition.match(/filename\*=UTF-8''([^;\s]+)/);
          if (starMatch) {
            filename = decodeURIComponent(starMatch[1]);
          } else {
            // 回退到 filename="xxx" 或 filename=xxx
            var plainMatch = disposition.match(/filename\s*=\s*"?([^";\s]+)"?/);
            if (plainMatch) {
              filename = decodeURIComponent(plainMatch[1]);
            }
          }
        }

        var blob = await resp.blob();
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        alert("导出失败: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '📤 导出';
      }
    };
    // 新建产品按钮
    document.getElementById("btnNewProd").onclick = function () {
      navigate("#product-new"); render("#product-new");
    };
    // 弹窗关闭
    document.getElementById("productModal").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("show"); });
  };

  /** 收集筛选参数并调用后端接口查询 */
  function getFilterParams() {
    var params = {};
    var name = document.getElementById("filterProdName").value.trim();
    if (name) params.name = name;
    var code = document.getElementById("filterProdCode").value.trim();
    if (code) params.code = code;
    var trainType = document.getElementById("filterTrainType").value;
    if (trainType) params.trainType = trainType;
    var trainMode = document.getElementById("filterTrainMode").value;
    if (trainMode) params.trainMode = trainMode;
    var trainSubject = document.getElementById("filterTrainSubject").value;
    if (trainSubject) params.trainSubject = trainSubject;
    var grade = document.getElementById("filterGrade").value;
    if (grade) params.grade = grade;
    var subject = document.getElementById("filterSubject").value;
    if (subject) params.subject = subject;
    var position = document.getElementById("filterPosition").value;
    if (position) params.position = position;
    var trainTarget = document.getElementById("filterTrainTarget").value.trim();
    if (trainTarget) params.trainTarget = trainTarget;
    return params;
  }

  function applyProductFilter() {
    var tbody = document.getElementById("productTbody");
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><div class="spinner"></div><p>查询中...</p></div></td></tr>';
    var params = getFilterParams();
    api.products(params).then(function (r) {
      if (r.code !== 200) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><p>查询失败</p></div></td></tr>';
        return;
      }
      pageState.products.all = r.data.products || [];
      pageState.products.filtered = pageState.products.all.slice();
      pageState.products.page = 1;
      document.getElementById("productTotal").textContent = '共 ' + pageState.products.all.length + ' 条';
      renderProductTable();
    }).catch(function () {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><p>网络错误</p></div></td></tr>';
    });
  }

  function renderProductTable() {
    var s = pageState.products, tbody = document.getElementById("productTbody");
    var start = (s.page - 1) * 10, items = s.filtered.slice(start, start + 10);
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><p>暂无数据</p></div></td></tr>'; return; }
    tbody.innerHTML = items.map(function (p) {
      var subjectText = p.trainingSubject || '--';
      var locationText = cityOnly(p.trainingLocation);
      return '<tr>' +
        '<td>' + renderProductInfo(p) + '</td>' +
        '<td class="cell-target">' + renderTarget(p) + '</td>' +
        '<td><span class="cell-truncate cell-subject" title="' + escAttr(subjectText) + '">' + escHtml(subjectText) + '</span></td>' +
        '<td><span class="cell-truncate cell-location" title="' + escAttr(p.trainingLocation || '') + '">' + escHtml(locationText) + '</span></td>' +
        '<td><span class="badge badge-success">' + (p.courseCount || 0) + ' 学时</span></td>' +
        '<td>' + statusBadge(p.status) + '</td>' +
        '<td>' + (p.createdAt || '--') + '</td>' +
        '<td>' + productActions(p) + '</td></tr>';
    }).join("");
    renderProductPagination();
  }

  /** 提取城市名（去掉省份前缀） */
  function cityOnly(location) {
    if (!location) return '--';
    var idx = location.indexOf(' ');
    return idx > 0 ? location.substring(idx + 1) : location;
  }

  /** 转义 HTML 属性值 */
  function escAttr(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** 转义 HTML 文本 */
  function escHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderProductInfo(p) {
    var tags = [];
    if (p.trainingType) tags.push('<span class="tag tag-blue">' + p.trainingType + '</span>');
    if (p.trainingMode) tags.push('<span class="tag tag-green">' + p.trainingMode + '</span>');
    var imgUrl = (p.images || '').split(/[、,\s]+/).filter(Boolean)[0] || '';
    var imgHtml = imgUrl
      ? '<img src="' + imgUrl + '" alt="" style="width:60px;height:45px;border-radius:4px;object-fit:cover;flex-shrink:0;" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2245%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2260%22 height=%2245%22/%3E%3Ctext fill=%22%23ccc%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.35em%22 font-size=%2212%22%3E🖼%3C/text%3E%3C/svg%3E\'">'
      : '<div style="width:60px;height:45px;border-radius:4px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📷</div>';
    return '<div style="display:flex;align-items:flex-start;gap:10px;">' +
      imgHtml +
      '<div style="min-width:0;">' +
        '<div style="font-size:12px;color:#999;">编号：' + (p.productCode || '--') + '</div>' +
        '<div class="cell-truncate cell-name" title="' + escAttr(p.name || '') + '" style="font-weight:500;color:#1f2937;margin:2px 0;">' + escHtml(p.name || '--') + '</div>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap;">' + tags.join('') + '</div>' +
      '</div></div>';
  }

  function renderTarget(p) {
    if (!p.trainingTarget) return '--';
    var targets = p.trainingTarget.split('、');
    var visible = targets.slice(0, 3);
    var hidden = targets.length - 3;
    var html = '<div class="cell-truncate" title="' + escAttr(p.trainingTarget) + '">';
    visible.forEach(function (t) {
      html += '<span class="target-tag" style="display:inline-block;background:#f0f5ff;color:#1890ff;padding:2px 8px;border-radius:4px;font-size:12px;margin-right:4px;">' + escHtml(t) + '</span>';
    });
    if (hidden > 0) {
      html += '<span class="target-more">+' + hidden + '</span>';
    }
    html += '</div>';
    return html;
  }

  function productActions(p) {
    return '<div class="btn-group" style="gap:4px;">' +
      '<button class="btn-link" onclick="navigate(\'#product-edit/' + p.id + '\'); render(\'#product-edit\', {id:' + p.id + '})">编辑</button>' +
      '<button class="btn-link">复制</button>' +
      '<button class="btn-link">新建课程</button>' +
      '<button class="btn-link btn-link-danger" onclick="window._confirmDelete(' + p.id + ', \'' + (p.name || '').replace(/'/g, "\\'") + '\')">删除</button>' +
      '</div>';
  }

  function renderProductPagination() {
    var s = pageState.products, total = Math.ceil(s.filtered.length / 10);
    var pag = document.getElementById("productPagination");
    if (total <= 1) { pag.innerHTML = ""; return; }
    var html = '<button ' + (s.page === 1 ? "disabled" : "") + ' onclick="window._productPage(' + (s.page - 1) + ')">上一页</button>';
    for (var i = 1; i <= total; i++) html += '<button class="' + (i === s.page ? "active" : "") + '" onclick="window._productPage(' + i + ')">' + i + '</button>';
    html += '<button ' + (s.page === total ? "disabled" : "") + ' onclick="window._productPage(' + (s.page + 1) + ')">下一页</button>';
    pag.innerHTML = html;
  }
  window._productPage = function (p) { pageState.products.page = p; renderProductTable(); };

  /* ── 删除确认弹窗 ───────────────────────── */
  window._confirmDelete = function (id, name) {
    var overlay = document.getElementById("confirmModal");
    if (!overlay) {
      // 动态创建确认弹窗
      overlay = document.createElement("div");
      overlay.id = "confirmModal";
      overlay.className = "modal-overlay";
      overlay.innerHTML =
        '<div class="modal-box modal-confirm">' +
          '<div class="confirm-icon">⚠️</div>' +
          '<h3 style="text-align:center;">确认删除</h3>' +
          '<p id="confirmMsg" style="text-align:center;color:#666;margin-bottom:20px;"></p>' +
          '<div style="display:flex;gap:12px;justify-content:center;">' +
            '<button class="btn btn-outline" id="confirmCancel">取消</button>' +
            '<button class="btn btn-danger" id="confirmOk">确认删除</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);

      // 点击遮罩关闭
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.classList.remove("show");
      });
    }

    document.getElementById("confirmMsg").textContent = '确定要删除产品 "' + name + '" 吗？此操作不可恢复。';
    overlay.classList.add("show");

    var cancelBtn = document.getElementById("confirmCancel");
    var okBtn = document.getElementById("confirmOk");

    var newCancel = cancelBtn.cloneNode(true);
    var newOk = okBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    okBtn.parentNode.replaceChild(newOk, okBtn);

    newCancel.addEventListener("click", function () {
      overlay.classList.remove("show");
    });

    newOk.addEventListener("click", async function () {
      newOk.disabled = true;
      newOk.innerHTML = '<span class="spinner"></span> 删除中...';
      try {
        var r = await api.deleteProduct(id);
        newOk.disabled = false;
        newOk.innerHTML = '确认删除';
        overlay.classList.remove("show");
        if (r.code === 200) {
          // 刷新列表（保持当前筛选条件）
          var params = getFilterParams();
          api.products(params).then(function (res) {
            if (res.code === 200) {
              pageState.products.all = res.data.products || [];
              pageState.products.filtered = pageState.products.all.slice();
              document.getElementById("productTotal").textContent = '共 ' + pageState.products.all.length + ' 条';
              renderProductTable();
            }
          });
        } else {
          alert('删除失败: ' + (r.message || '未知错误'));
        }
      } catch (err) {
        newOk.disabled = false;
        newOk.innerHTML = '确认删除';
        overlay.classList.remove("show");
        alert('网络请求失败，请确认服务已启动');
      }
    });
  };

  /* ── 共享组件函数 ───────────────────────── */

  function statusBadge(status) {
    var isPublished = status === "published";
    return '<span class="badge ' + (isPublished ? 'badge-success' : 'badge-secondary') + '">' + (isPublished ? '已发布' : '未发布') + '</span>';
  }

  window._viewProduct = function (id) {
    api.products().then(function (r) {
      if (r.code !== 200) return;
      var p = r.data.products.find(function (x) { return x.id === id; });
      if (!p) return;
      var content = document.getElementById("productModalContent");
      content.innerHTML = '<h3>📦 产品详情</h3>' +
        '<div class="info-row"><span class="info-label">产品名称</span><span class="info-value">' + p.name + '</span></div>' +
        '<div class="info-row"><span class="info-label">培训对象</span><span class="info-value">' + p.trainingTarget + '</span></div>' +
        '<div class="info-row"><span class="info-label">培训主题</span><span class="info-value">' + p.trainingSubject + '</span></div>' +
        '<div class="info-row"><span class="info-label">培训地点</span><span class="info-value">' + p.trainingLocation + '</span></div>' +
        '<div class="info-row"><span class="info-label">课程学时</span><span class="info-value"><span class="badge badge-success">' + p.courseCount + ' 学时</span></span></div>' +
        '<div class="info-row"><span class="info-label">产品状态</span><span class="info-value"><span class="badge ' + (p.status === 'published' ? 'badge-success' : 'badge-secondary') + '">' + (p.status === 'published' ? '已发布' : '未发布') + '</span></span></div>' +
        '<div class="info-row"><span class="info-label">创建时间</span><span class="info-value">' + p.createdAt + '</span></div>' +
        '<div class="info-row"><span class="info-label">产品描述</span><span class="info-value">' + (p.description || '无') + '</span></div>' +
        '<div style="text-align:right;margin-top:16px;"><button class="btn btn-outline btn-sm" onclick="document.getElementById(\'productModal\').classList.remove(\'show\')">关闭</button></div>';
      document.getElementById("productModal").classList.add("show");
    });
  };

  /* ═══════════════════════════════════════════════════════
   *  新增产品 — 独立页面
   * ═══════════════════════════════════════════════════════ */
  routes["#product-new"] = function () {
    return '<div class="card"><div class="card-body" style="padding:28px 32px;">' +
      '<div class="page-form-header">' +
        '<button class="btn btn-outline btn-sm" id="btnBackToProducts">← 返回产品列表</button>' +
      '</div>' +
      '<h3 style="margin-bottom:24px;font-size:20px;">📦 新增产品</h3>' +
      '<form id="newProductForm">' +
      // ── 培训类型与模式（顶部）──
      '<div class="form-section">' +
        '<div class="form-section-title">培训类型与模式</div>' +
        '<div class="form-row form-row-2">' +
          '<div class="form-group">' +
            '<label>培训类型 <span class="required">*</span></label>' +
            '<div class="radio-group" id="npTrainingType">' +
              '<label class="radio-option"><input type="radio" name="npTrainingType" value="集中培训"><span class="radio-dot"></span><span>集中培训</span></label>' +
              '<label class="radio-option"><input type="radio" name="npTrainingType" value="在线学习"><span class="radio-dot"></span><span>在线学习</span></label>' +
              '<label class="radio-option"><input type="radio" name="npTrainingType" value="混合培训"><span class="radio-dot"></span><span>混合培训</span></label>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>培训模式 <span class="required">*</span></label>' +
            '<div class="checkbox-group" id="npTrainingMode">' +
              '<label class="checkbox-option"><input type="checkbox" value="线上"><span class="checkbox-mark"></span><span>线上</span></label>' +
              '<label class="checkbox-option"><input type="checkbox" value="线下"><span class="checkbox-mark"></span><span>线下</span></label>' +
              '<label class="checkbox-option"><input type="checkbox" value="线上+线下"><span class="checkbox-mark"></span><span>线上+线下</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // ── 基本信息 ──
      '<div class="form-section">' +
        '<div class="form-section-title">基本信息</div>' +
        '<div class="form-row form-row-2">' +
          '<div class="form-group">' +
            '<label>产品编号 <span class="required">*</span></label>' +
            '<input type="text" id="npProductCode" readonly placeholder="保存时自动生成" maxlength="30" style="background:#f5f5f5;color:#8c8c8c;cursor:not-allowed;">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>产品名称 <span class="required">*</span></label>' +
            '<input type="text" id="npName" placeholder="请输入产品名称" maxlength="100" required>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // ── 产品图片 ──
      '<div class="form-section">' +
        '<div class="form-section-title">产品图片 <span style="font-weight:400;color:#9ca3af;font-size:12px;">（最多3张，点击上传）</span></div>' +
        '<div class="form-group">' +
          '<div class="image-upload-area" id="imageUploadArea">' +
            '<div class="image-preview-grid" id="imagePreviewGrid"></div>' +
            '<div class="image-upload-placeholder" id="imagePlaceholder">' +
              '<span style="font-size:42px;color:#bfbfbf;">&#x1F4F7;</span>' +
              '<p style="color:#bfbfbf;font-size:13px;margin:8px 0;">点击上传图片（支持 jpg/png/gif，最多3张）</p>' +
              '<p style="color:#d9d9d9;font-size:11px;">单张最大 10MB</p>' +
            '</div>' +
          '</div>' +
          '<input type="file" id="npImageFile" accept="image/*" multiple style="display:none;">' +
          '<input type="text" id="npImage" placeholder="或直接输入图片URL（多张用、分隔）" style="margin-top:8px;">' +
          '<div class="upload-tip">主图直接影响课程在商城的曝光引流效果，图片上传规范要求，仅支持png、jpg、jpeg格式，大小5M内，至多可以上传3张，可拖拽调整主图顺序</div>' +
        '</div>' +
      '</div>' +
      // ── 培训信息 ──
      '<div class="form-section">' +
        '<div class="form-section-title">培训信息</div>' +
        // Row 1: 岗位、学段、学科
        '<div class="form-row form-row-3">' +
          '<div class="form-group">' +
            '<label>岗位 <span class="required">*</span></label>' +
            '<div class="multi-select" id="npPosition">' +
              '<div class="multi-select-trigger">' +
                '<span class="multi-select-placeholder">请选择岗位</span>' +
                '<span class="multi-select-arrow">▾</span>' +
              '</div>' +
              '<div class="multi-select-dropdown">' +
                '<label class="multi-select-option"><input type="checkbox" value="校园长"><span>校园长</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="中层干部"><span>中层干部</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="教师"><span>教师</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="班主任"><span>班主任</span></label>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>学段 <span class="required">*</span></label>' +
            '<div class="multi-select" id="npGrade">' +
              '<div class="multi-select-trigger">' +
                '<span class="multi-select-placeholder">请选择学段</span>' +
                '<span class="multi-select-arrow">▾</span>' +
              '</div>' +
              '<div class="multi-select-dropdown">' +
                '<label class="multi-select-option"><input type="checkbox" value="幼儿园"><span>幼儿园</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="小学"><span>小学</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="初中"><span>初中</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="高中"><span>高中</span></label>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>学科 <span class="required">*</span></label>' +
            '<div class="multi-select" id="npSubject">' +
              '<div class="multi-select-trigger">' +
                '<span class="multi-select-placeholder">请选择学科</span>' +
                '<span class="multi-select-arrow">▾</span>' +
              '</div>' +
              '<div class="multi-select-dropdown">' +
                '<label class="multi-select-option"><input type="checkbox" value="语文"><span>语文</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="数学"><span>数学</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="英语"><span>英语</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="信息技术"><span>信息技术</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="综合"><span>综合</span></label>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Row 2: 培训地点、课程学时、课程主题
        '<div class="form-row form-row-3">' +
          '<div class="form-group">' +
            '<label>培训地点 <span class="required">*</span></label>' +
            '<div class="cascade-row">' +
              '<select id="npProvince"><option value="">请选择省</option></select>' +
              '<select id="npCity"><option value="">请选择市</option></select>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>课程学时 <span class="required">*</span></label>' +
            '<input type="number" id="npCourseHours" placeholder="请输入课程学时" min="1" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>课程主题 <span class="required">*</span></label>' +
            '<div class="multi-select" id="npTrainingSubject">' +
              '<div class="multi-select-trigger">' +
                '<span class="multi-select-placeholder">请选择课程主题</span>' +
                '<span class="multi-select-arrow">▾</span>' +
              '</div>' +
              '<div class="multi-select-dropdown">' +
                '<label class="multi-select-option"><input type="checkbox" value="校验科研"><span>校验科研</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="课堂教学"><span>课堂教学</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="中考高考"><span>中考高考</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="班级管理"><span>班级管理</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="名校参访"><span>名校参访</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="跟岗实践"><span>跟岗实践</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="师德党政"><span>师德党政</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="幼教专区"><span>幼教专区</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="教育管理"><span>教育管理</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="无尽建设"><span>无尽建设</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="人工智能"><span>人工智能</span></label>' +
                '<label class="multi-select-option"><input type="checkbox" value="课题研究"><span>课题研究</span></label>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Row 3: 培训目标
        '<div class="form-group">' +
          '<label>培训目标 <span class="required">*</span></label>' +
          '<textarea id="npTrainingObjective" placeholder="请输入培训目标" maxlength="300" rows="3" required></textarea>' +
          '<div class="char-counter"><span id="npObjectiveCount">0</span>/300</div>' +
        '</div>' +
      '</div>' +
      // ── 培训内容 ──
      '<div class="form-section">' +
        '<div class="form-section-title">培训内容</div>' +
        '<div class="form-group">' +
          '<label>产品描述</label>' +
          '<div class="richtext-editor" id="richtextEditor">' +
            '<div class="richtext-toolbar">' +
              '<button type="button" data-cmd="bold" title="加粗"><b>B</b></button>' +
              '<button type="button" data-cmd="italic" title="斜体"><i>I</i></button>' +
              '<button type="button" data-cmd="underline" title="下划线"><u>U</u></button>' +
              '<span class="toolbar-sep"></span>' +
              '<button type="button" data-cmd="insertUnorderedList" title="无序列表">&#x2022;≡</button>' +
              '<button type="button" data-cmd="insertOrderedList" title="有序列表">1≡</button>' +
              '<span class="toolbar-sep"></span>' +
              '<button type="button" data-cmd="formatBlock" data-val="<h3>" title="标题">H</button>' +
              '<button type="button" data-cmd="removeFormat" title="清除格式">Tx</button>' +
            '</div>' +
            '<div class="richtext-content" id="npDescription" contenteditable="true" placeholder="请输入产品描述"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // ── 按钮 ──
      '<div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;padding-top:16px;border-top:1px solid #f0f0f0;">' +
        '<button type="button" class="btn btn-outline" id="btnCancelProduct">取消</button>' +
        '<button type="submit" class="btn btn-primary" id="btnSaveProduct">💾 保存</button>' +
      '</div>' +
      '</form>' +
      '<div id="npFormMsg" style="margin-top:12px;"></div>' +
      '</div></div>';
  };

  _after["#product-new"] = function () {
    var form = document.getElementById("newProductForm");
    var btnCancel = document.getElementById("btnCancelProduct");
    var btnBack = document.getElementById("btnBackToProducts");
    var imageInput = document.getElementById("npImage");
    var fileInput = document.getElementById("npImageFile");
    var uploadArea = document.getElementById("imageUploadArea");
    var previewGrid = document.getElementById("imagePreviewGrid");
    var placeholder = document.getElementById("imagePlaceholder");
    var msgEl = document.getElementById("npFormMsg");
    var uploadedUrls = [];

    // 渲染预览网格
    function renderPreviews() {
      if (!previewGrid) return;

      var allUrls = [];
      uploadedUrls.forEach(function(u) { allUrls.push(u); });
      var manualVal = imageInput ? imageInput.value.trim() : "";
      if (manualVal) {
        manualVal.split(/[、,\s]+/).filter(Boolean).forEach(function(u) { allUrls.push(u); });
      }

      // 显示/隐藏占位符
      if (allUrls.length === 0) {
        previewGrid.style.display = "none";
        previewGrid.innerHTML = "";
        if (placeholder) placeholder.style.display = "block";
      } else {
        previewGrid.style.display = "flex";
        if (placeholder) placeholder.style.display = "none";
        previewGrid.innerHTML = "";

        allUrls.forEach(function(url, idx) {
          var box = document.createElement("div");
          box.className = "preview-box";

          var img = document.createElement("img");
          img.src = url;
          img.alt = "预览图片";
          img.onerror = function() {
            this.style.display = "none";
            var errSpan = document.createElement("span");
            errSpan.textContent = "⚠️ 加载失败";
            errSpan.style.cssText = "font-size:11px;color:#ff4d4f;display:flex;align-items:center;justify-content:center;width:100%;height:100%;";
            box.appendChild(errSpan);
          };

          var removeBtn = document.createElement("span");
          removeBtn.className = "preview-remove";
          removeBtn.textContent = "×";
          removeBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            var i = parseInt(this.getAttribute("data-idx"));
            var uploadCount = uploadedUrls.length;
            if (i < uploadCount) {
              uploadedUrls.splice(i, 1);
            } else {
              var manualIdx = i - uploadCount;
              var parts = (imageInput.value || "").split(/[、,\s]+/).filter(Boolean);
              parts.splice(manualIdx, 1);
              imageInput.value = parts.join("、");
            }
            renderPreviews();
          });
          removeBtn.setAttribute("data-idx", idx);

          box.appendChild(img);
          box.appendChild(removeBtn);
          previewGrid.appendChild(box);
        });
      }

      // 更新上传区域提示
      var remaining = 3 - uploadedUrls.length;
      if (uploadArea && remaining > 0 && uploadedUrls.length > 0) {
        uploadArea.setAttribute("title", "还可上传 " + remaining + " 张");
      }
    }

    // 省市区联动数据
    var cityData = {
      "北京":["北京"],"上海":["上海"],"天津":["天津"],"重庆":["重庆"],
      "广东":["广州","深圳","珠海","东莞","佛山","惠州","中山","汕头","江门","湛江"],
      "浙江":["杭州","宁波","温州","嘉兴","湖州","绍兴","金华","台州","舟山"],
      "江苏":["南京","苏州","无锡","常州","南通","徐州","扬州","镇江","盐城","泰州"],
      "湖北":["武汉","宜昌","襄阳","荆州","黄石","十堰","孝感","荆门","鄂州","黄冈"],
      "四川":["成都","绵阳","德阳","宜宾","南充","泸州","达州","乐山","广元","遂宁"],
      "山东":["济南","青岛","烟台","潍坊","临沂","淄博","威海","济宁","泰安","日照"],
      "福建":["福州","厦门","泉州","漳州","莆田","龙岩","三明","南平","宁德"],
      "河南":["郑州","洛阳","开封","南阳","新乡","许昌","周口","商丘","驻马店","信阳"],
      "湖南":["长沙","株洲","湘潭","衡阳","岳阳","常德","郴州","怀化","邵阳","益阳"],
      "河北":["石家庄","唐山","保定","邯郸","廊坊","沧州","秦皇岛","张家口","承德","邢台"],
      "陕西":["西安","咸阳","宝鸡","渭南","延安","汉中","榆林","安康","商洛"],
      "辽宁":["沈阳","大连","鞍山","抚顺","锦州","营口","丹东","盘锦","朝阳","本溪"],
      "吉林":["长春","吉林","四平","通化","延边","白城","辽源","松原","白山"],
      "黑龙江":["哈尔滨","齐齐哈尔","牡丹江","大庆","佳木斯","绥化","鸡西","双鸭山","伊春"],
      "安徽":["合肥","芜湖","蚌埠","马鞍山","安庆","黄山","阜阳","宿州","滁州","六安"],
      "江西":["南昌","九江","赣州","景德镇","吉安","上饶","宜春","抚州","萍乡"],
      "山西":["太原","大同","阳泉","长治","临汾","晋中","运城","忻州","吕梁","晋城"],
      "贵州":["贵阳","遵义","六盘水","安顺","毕节","铜仁","黔东南","黔南","黔西南"],
      "云南":["昆明","曲靖","玉溪","大理","丽江","红河","楚雄","昭通","普洱","保山"],
      "广西":["南宁","柳州","桂林","北海","玉林","梧州","钦州","百色","贵港"],
      "海南":["海口","三亚","儋州","琼海","文昌","万宁"],
      "甘肃":["兰州","天水","酒泉","张掖","武威","平凉","庆阳","定西","陇南"],
      "青海":["西宁","海东","海西","海南","海北","玉树","果洛","黄南"],
      "宁夏":["银川","石嘴山","吴忠","固原","中卫"],
      "新疆":["乌鲁木齐","克拉玛依","吐鲁番","哈密","昌吉","伊犁","喀什","阿克苏","和田"],
      "内蒙古":["呼和浩特","包头","鄂尔多斯","赤峰","呼伦贝尔","通辽","乌兰察布","巴彦淖尔","乌海"],
      "西藏":["拉萨","日喀则","昌都","林芝","山南","那曲"],
      "台湾":["台北","高雄","台中","台南","新北","桃园","新竹"],
      "香港":["香港"],
      "澳门":["澳门"]
    };

    // 初始化省份下拉
    var provSel = document.getElementById("npProvince");
    var citySel = document.getElementById("npCity");
    if (provSel) {
      Object.keys(cityData).forEach(function(p) {
        var opt = document.createElement("option");
        opt.value = p; opt.textContent = p;
        provSel.appendChild(opt);
      });
    }

    // 省份变化 → 更新城市
    if (provSel && citySel) {
      provSel.addEventListener("change", function () {
        citySel.innerHTML = '<option value="">请选择市</option>';
        var cities = cityData[this.value];
        if (cities) {
          cities.forEach(function(c) {
            var opt = document.createElement("option");
            opt.value = c; opt.textContent = c;
            citySel.appendChild(opt);
          });
        }
      });
    }

    // 初始化多选下拉：岗位、学段、学科、课程主题
    initMultiSelect("npPosition");
    initMultiSelect("npGrade");
    initMultiSelect("npSubject");
    initMultiSelect("npTrainingSubject");

    // 初始化富文本编辑器
    initRichTextEditor("richtextEditor");

    // 点击上传区域 → 打开文件选择器
    if (uploadArea && fileInput) {
      uploadArea.addEventListener("click", function (e) {
        // 如果点击的是预览图片或移除按钮，不触发上传
        if (e.target.closest(".preview-box")) return;
        if (uploadedUrls.length >= 3) {
          if (msgEl) msgEl.innerHTML = '<div class="alert alert-warning">最多上传3张图片，请先移除已有图片</div>';
          return;
        }
        fileInput.click();
      });

      // 文件选择 → 上传并预览
      fileInput.addEventListener("change", async function () {
        var files = Array.from(this.files);
        var remaining = 3 - uploadedUrls.length;
        if (files.length > remaining) {
          files = files.slice(0, remaining);
        }

        if (files.length === 0) return;

        // 显示上传中状态
        if (msgEl) msgEl.innerHTML = '<div class="alert" style="background:#fffbe6;color:#faad14;border:1px solid #ffe58f;">⏳ 正在上传 ' + files.length + ' 张图片...</div>';

        var hasError = false;
        for (var i = 0; i < files.length; i++) {
          var f = files[i];
          if (!f.type.startsWith("image/")) continue;

          var formData = new FormData();
          formData.append("file", f);
          try {
            var headers = {};
            var token = localStorage.getItem("token");
            if (token) headers["Authorization"] = "Bearer " + token;
            var resp = await fetch("/api/upload", {
              method: "POST",
              headers: headers,
              body: formData
            });
            var r = await resp.json();
            if (r.code === 200 && r.data && r.data.url) {
              uploadedUrls.push(r.data.url);
            } else {
              hasError = true;
              if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">上传失败: ' + (r.message || "未知错误") + '</div>';
            }
          } catch (err) {
            hasError = true;
            if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">上传失败，请检查网络连接</div>';
          }
        }

        // 立即渲染预览
        renderPreviews();

        // 清理 file input（允许重复选同一文件）
        fileInput.value = "";

        if (!hasError && uploadedUrls.length > 0) {
          if (msgEl) msgEl.innerHTML = '<div class="alert alert-success">✅ 已上传 ' + uploadedUrls.length + ' 张图片</div>';
        }
      });
    }

    // 手动输入URL → 更新预览
    if (imageInput) {
      imageInput.addEventListener("input", function () {
        renderPreviews();
      });
    }

    // 取消 / 返回按钮
    if (btnCancel) {
      btnCancel.addEventListener("click", function () {
        navigate("#products"); render("#products");
      });
    }
    if (btnBack) {
      btnBack.addEventListener("click", function () {
        navigate("#products"); render("#products");
      });
    }

    // 字符计数
    var objectiveEl = document.getElementById("npTrainingObjective");
    var countEl = document.getElementById("npObjectiveCount");
    if (objectiveEl && countEl) {
      objectiveEl.addEventListener("input", function () {
        countEl.textContent = this.value.length;
      });
    }

    // 表单提交
    if (form) {
      form.onsubmit = async function (e) {
        e.preventDefault();

        // ─ 自动生成产品编号 ─
        var codeEl = document.getElementById("npProductCode");
        if (codeEl && !codeEl.value.trim()) {
          var now = new Date();
          var pad = function(n) { return n < 10 ? "0" + n : "" + n; };
          codeEl.value = "cp" + now.getFullYear() +
            pad(now.getMonth() + 1) + pad(now.getDate()) +
            pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
        }

        // ─ 必填校验 ─
        var nameEl = document.getElementById("npName");
        var name = nameEl ? nameEl.value.trim() : "";
        if (!name) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请输入产品名称</div>'; return; }

        var positionVal = getMultiSelectValues("npPosition");
        if (!positionVal) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择岗位</div>'; return; }
        var gradeVal = getMultiSelectValues("npGrade");
        if (!gradeVal) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择学段</div>'; return; }
        var subjectVal = getMultiSelectValues("npSubject");
        if (!subjectVal) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择学科</div>'; return; }

        var provinceVal = document.getElementById("npProvince").value;
        var cityVal = document.getElementById("npCity").value;
        if (!provinceVal) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择省份</div>'; return; }
        if (!cityVal) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择城市</div>'; return; }
        var locationVal = provinceVal + " " + cityVal;

        var hoursVal = parseInt(document.getElementById("npCourseHours").value) || 0;
        if (!hoursVal || hoursVal < 1) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请输入课程学时（至少1学时）</div>'; return; }

        var topicVal = getMultiSelectValues("npTrainingSubject");
        if (!topicVal) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择课程主题</div>'; return; }

        var objectiveVal = document.getElementById("npTrainingObjective").value.trim();
        if (!objectiveVal) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请输入培训目标</div>'; return; }

        // 培训类型（单选）
        var trainingTypeRadio = document.querySelector('input[name="npTrainingType"]:checked');
        var trainingType = trainingTypeRadio ? trainingTypeRadio.value : "";
        // 培训模式（多选）
        var trainingMode = getCheckboxGroupValues("npTrainingMode");

        // 合并上传的图片URL和手动输入的URL
        var allImageUrls = uploadedUrls.slice();
        var manualUrl = document.getElementById("npImage").value.trim();
        if (manualUrl) {
          manualUrl.split(/[、,\s]+/).filter(Boolean).forEach(function(u) { allImageUrls.push(u); });
        }

        var data = {
          productCode: document.getElementById("npProductCode").value.trim(),
          name: name,
          images: allImageUrls.join("、"),
          trainingType: trainingType,
          trainingMode: trainingMode,
          trainingSubject: topicVal,
          trainingLocation: locationVal,
          trainingTarget: positionVal,
          grade: gradeVal,
          subject: subjectVal,
          position: positionVal,
          courseCount: hoursVal,
          status: "unpublished",
          description: document.getElementById("npDescription").innerHTML.trim(),
          trainingObjective: objectiveVal
        };

        var btnSave = document.getElementById("btnSaveProduct");
        btnSave.disabled = true;
        btnSave.innerHTML = '<span class="spinner"></span> 保存中...';

        try {
          var r = await api.createProduct(data);
          btnSave.disabled = false;
          btnSave.innerHTML = "💾 保存";
          if (r.code === 200) {
            if (msgEl) msgEl.innerHTML = '<div class="alert alert-success">' + (r.message || "创建成功") + '，即将返回列表...</div>';
            setTimeout(function () {
              navigate("#products"); render("#products");
            }, 800);
          } else {
            if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">' + (r.message || "创建失败") + '</div>';
          }
        } catch (err) {
          btnSave.disabled = false;
          btnSave.innerHTML = "💾 保存";
          if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">网络请求失败，请确认服务已启动</div>';
        }
      };
    }
  };

  /* ═══════════════════════════════════════════════════════
   *  编辑产品 — 独立页面
   * ═══════════════════════════════════════════════════════ */
  routes["#product-edit"] = function () {
    // 复用新增产品的表单 HTML
    return routes["#product-new"]();
  };

  _after["#product-edit"] = function () {
    var editId = pageState.editProductId;
    if (!editId) { navigate("#products"); render("#products"); return; }

    // 复用新增产品的初始化（多选、富文本、上传……）
    // 先调用新增产品的 after 来设置所有 UI 组件
    _after["#product-new"]();

    // 修改标题和按钮
    var titleEl = document.querySelector("h3");
    if (titleEl) titleEl.textContent = "📝 编辑产品";

    var btnSave = document.getElementById("btnSaveProduct");
    if (btnSave) btnSave.innerHTML = "💾 更新";

    var msgEl = document.getElementById("npFormMsg");

    // 加载产品数据
    api.products().then(function (r) {
      if (r.code !== 200) return;
      var p = (r.data.products || []).find(function (x) { return x.id === editId; });
      if (!p) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">产品不存在</div>'; return; }

      // ── 回显各字段 ──
      // 产品编号（只读）
      var codeEl = document.getElementById("npProductCode");
      if (codeEl) codeEl.value = p.productCode || "";

      // 产品名称
      var nameEl = document.getElementById("npName");
      if (nameEl) nameEl.value = p.name || "";

      // 图片URL（手动输入方式）
      var imageEl = document.getElementById("npImage");
      if (imageEl && p.images) imageEl.value = p.images;

      // 培训类型（单选）
      if (p.trainingType) {
        var radio = document.querySelector('input[name="npTrainingType"][value="' + p.trainingType + '"]');
        if (radio) radio.checked = true;
      }

      // 培训模式（多选checkbox组）
      if (p.trainingMode) {
        p.trainingMode.split("、").forEach(function (v) {
          var cb = document.querySelector('#npTrainingMode input[value="' + v + '"]');
          if (cb) cb.checked = true;
        });
      }

      // 岗位、学段、课程主题（多选下拉）
      function fillMultiSelect(id, values) {
        if (!values) return;
        values.split("、").forEach(function (v) {
          var cb = document.querySelector('#' + id + ' input[value="' + v + '"]');
          if (cb) cb.checked = true;
        });
        var container = document.getElementById(id);
        if (container && window.updateMultiSelectDisplay) {
          window.updateMultiSelectDisplay(container);
        }
      }
      fillMultiSelect("npPosition", p.position);
      fillMultiSelect("npGrade", p.grade);
      fillMultiSelect("npSubject", p.subject);
      fillMultiSelect("npTrainingSubject", p.trainingSubject);

      // 学科（多选下拉）

      // 培训地点（省+市联动）
      if (p.trainingLocation) {
        var parts = p.trainingLocation.split(" ");
        if (parts.length === 2) {
          var provSel = document.getElementById("npProvince");
          var citySel = document.getElementById("npCity");
          if (provSel) {
            provSel.value = parts[0];
            // 触发 change 事件让城市下拉加载
            var evt = new Event("change");
            provSel.dispatchEvent(evt);
            if (citySel) {
              // 需要等城市下拉渲染完成后再设值
              setTimeout(function () {
                citySel.value = parts[1];
              }, 0);
            }
          }
        }
      }

      // 课程学时
      var hoursEl = document.getElementById("npCourseHours");
      if (hoursEl && p.courseCount) hoursEl.value = p.courseCount;

      // 培训目标
      var objectiveEl = document.getElementById("npTrainingObjective");
      if (objectiveEl) objectiveEl.value = p.trainingObjective || "";

      // 培训内容（富文本）
      var descEl = document.getElementById("npDescription");
      if (descEl && p.description) descEl.innerHTML = p.description;

      // 产品图片（上传过的图片URL回显到预览）
      if (p.images) {
        var urls = p.images.split(/[、,\s]+/).filter(Boolean);
        urls.forEach(function (url) {
          // 外部URL直接加入手动输入；本地URL加入 uploadedUrls
          var localVarName = "_editUploadedUrls";
          window[localVarName] = window[localVarName] || [];
          window[localVarName].push(url);
        });
        // 触发 renderPreviews — 需要访问 uploadedUrls 变量
        // 因为 uploadedUrls 是 _after["#product-new"] 闭包内的变量，我们通过
        // 手动设置 npImage 输入框的值来触发 renderPreviews
        if (imageEl) {
          imageEl.value = p.images;
          // 触发 input 事件
          var inputEvt = new Event("input");
          imageEl.dispatchEvent(inputEvt);
        }
      }
    });

    // ── 覆盖表单提交（PUT 而非 POST）──
    var form = document.getElementById("newProductForm");
    if (form) {
      // 用 onsubmit 直接替换，覆盖 addEventListener 添加的监听器
      form.onsubmit = async function (e) {
        e.preventDefault();

        // 自动生成产品编号（如有必要）
        var codeEl = document.getElementById("npProductCode");
        if (codeEl && !codeEl.value.trim()) {
          var now = new Date();
          var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
          codeEl.value = "cp" + now.getFullYear() +
            pad(now.getMonth() + 1) + pad(now.getDate()) +
            pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
        }

        // 收集数据
        var nameEl2 = document.getElementById("npName");
        var name2 = nameEl2 ? nameEl2.value.trim() : "";
        if (!name2) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请输入产品名称</div>'; return; }

        var positionVal2 = getMultiSelectValues("npPosition");
        if (!positionVal2) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择岗位</div>'; return; }
        var gradeVal2 = getMultiSelectValues("npGrade");
        if (!gradeVal2) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择学段</div>'; return; }
        var subjectVal2 = getMultiSelectValues("npSubject");
        if (!subjectVal2) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择学科</div>'; return; }

        var provinceVal2 = document.getElementById("npProvince").value;
        var cityVal2 = document.getElementById("npCity").value;
        if (!provinceVal2) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择省份</div>'; return; }
        if (!cityVal2) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择城市</div>'; return; }
        var locationVal2 = provinceVal2 + " " + cityVal2;

        var hoursVal2 = parseInt(document.getElementById("npCourseHours").value) || 0;
        if (!hoursVal2 || hoursVal2 < 1) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请输入课程学时（至少1学时）</div>'; return; }

        var topicVal2 = getMultiSelectValues("npTrainingSubject");
        if (!topicVal2) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请选择课程主题</div>'; return; }

        var objectiveVal2 = document.getElementById("npTrainingObjective").value.trim();
        if (!objectiveVal2) { if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">请输入培训目标</div>'; return; }

        var trainingTypeRadio2 = document.querySelector('input[name="npTrainingType"]:checked');
        var trainingType2 = trainingTypeRadio2 ? trainingTypeRadio2.value : "";
        var trainingMode2 = getCheckboxGroupValues("npTrainingMode");

        var allImgUrls = [];
        var manualUrl2 = document.getElementById("npImage").value.trim();
        if (manualUrl2) {
          manualUrl2.split(/[、,\s]+/).filter(Boolean).forEach(function (u) { allImgUrls.push(u); });
        }

        var data2 = {
          productCode: codeEl.value.trim(),
          name: name2,
          images: allImgUrls.join("、"),
          trainingType: trainingType2,
          trainingMode: trainingMode2,
          trainingSubject: topicVal2,
          trainingLocation: locationVal2,
          trainingTarget: positionVal2,
          grade: gradeVal2,
          subject: subjectVal2,
          position: positionVal2,
          courseCount: hoursVal2,
          status: "unpublished",
          description: document.getElementById("npDescription").innerHTML.trim(),
          trainingObjective: objectiveVal2
        };

        if (btnSave) btnSave.disabled = true;
        if (btnSave) btnSave.innerHTML = '<span class="spinner"></span> 更新中...';
        try {
          var resp = await api.updateProduct(editId, data2);
          if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = "💾 更新"; }
          if (resp.code === 200) {
            if (msgEl) msgEl.innerHTML = '<div class="alert alert-success">' + (resp.message || "更新成功") + '，即将返回列表...</div>';
            setTimeout(function () { navigate("#products"); render("#products"); }, 800);
          } else {
            if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">' + (resp.message || "更新失败") + '</div>';
          }
        } catch (err) {
          if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = "💾 更新"; }
          if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">网络请求失败，请确认服务已启动</div>';
        }
      };
    }
  };

  /* ═══════════════════════════════════════════════════════
   *  富文本编辑器
   * ═══════════════════════════════════════════════════════ */
  function initRichTextEditor(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var content = container.querySelector(".richtext-content");
    var toolbar = container.querySelector(".richtext-toolbar");
    if (!content || !toolbar) return;

    var activeBtn = null;

    // 工具栏按钮点击
    toolbar.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      e.preventDefault();
      var cmd = btn.getAttribute("data-cmd");
      var val = btn.getAttribute("data-val") || null;
      if (cmd === "formatBlock" && val) {
        // 切换标题/段落
        if (document.queryCommandValue("formatBlock") === val.toLowerCase()) {
          val = "<p>";
        }
      }
      document.execCommand(cmd, false, val);
      content.focus();
      updateActive();
    });

    // 更新激活按钮状态
    function updateActive() {
      toolbar.querySelectorAll("button").forEach(function (b) {
        var cmd = b.getAttribute("data-cmd");
        var val = b.getAttribute("data-val");
        var active = false;
        if (cmd === "bold") active = document.queryCommandState("bold");
        else if (cmd === "italic") active = document.queryCommandState("italic");
        else if (cmd === "underline") active = document.queryCommandState("underline");
        else if (cmd === "insertUnorderedList") active = document.queryCommandState("insertUnorderedList");
        else if (cmd === "insertOrderedList") active = document.queryCommandState("insertOrderedList");
        else if (cmd === "formatBlock" && val) active = document.queryCommandValue("formatBlock") === val.toLowerCase();
        b.classList.toggle("active", active);
      });
    }

    content.addEventListener("keyup", updateActive);
    content.addEventListener("mouseup", updateActive);

    // placeholder 效果
    content.addEventListener("focus", function () {
      if (content.innerHTML === "" || content.innerHTML === "<br>") {
        content.innerHTML = "";
      }
    });
    content.addEventListener("blur", function () {
      if (content.innerHTML === "" || content.innerHTML === "<br>") {
        content.innerHTML = "";
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
   *  多选下拉组件
   * ═══════════════════════════════════════════════════════ */
  function initMultiSelect(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var trigger = container.querySelector(".multi-select-trigger");
    var dropdown = container.querySelector(".multi-select-dropdown");
    var placeholder = container.querySelector(".multi-select-placeholder");
    var checkboxes = container.querySelectorAll('input[type="checkbox"]');
    var selectedTags = container.querySelector(".multi-select-tags");
    if (!trigger || !dropdown) return;

    // 点击触发区切换下拉
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.contains("show");
      // 关闭所有其他多选
      document.querySelectorAll(".multi-select-dropdown.show").forEach(function (d) { d.classList.remove("show"); });
      if (!isOpen) dropdown.classList.add("show");
    });

    // 选项点击 — 更新显示
    checkboxes.forEach(function (cb) {
      cb.addEventListener("change", function () {
        updateMultiSelectDisplay(container);
      });
    });

    // 点击外部关闭
    document.addEventListener("click", function () {
      dropdown.classList.remove("show");
    });
    dropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    // 初始显示
    updateMultiSelectDisplay(container);
  }

  function updateMultiSelectDisplay(container) {
    var trigger = container.querySelector(".multi-select-trigger");
    var placeholder = container.querySelector(".multi-select-placeholder");
    var checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    var selected = [];
    checkboxes.forEach(function (cb) { selected.push(cb.value); });

    // 清除旧标签
    var oldTags = trigger.querySelectorAll(".multi-select-tag");
    oldTags.forEach(function (t) { t.remove(); });

    if (selected.length === 0) {
      if (placeholder) placeholder.style.display = "";
    } else {
      if (placeholder) placeholder.style.display = "none";
      selected.forEach(function (v) {
        var tag = document.createElement("span");
        tag.className = "multi-select-tag";
        tag.textContent = v;
        var removeBtn = document.createElement("span");
        removeBtn.className = "multi-select-tag-remove";
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          var cb = container.querySelector('input[value="' + v + '"]');
          if (cb) { cb.checked = false; updateMultiSelectDisplay(container); }
        });
        tag.appendChild(removeBtn);
        trigger.insertBefore(tag, placeholder || trigger.lastChild);
      });
    }
  }
  window.updateMultiSelectDisplay = updateMultiSelectDisplay;

  function getMultiSelectValues(id) {
    var container = document.getElementById(id);
    if (!container) return "";
    var selected = [];
    container.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
      selected.push(cb.value);
    });
    return selected.join("、");
  }

  function getCheckboxGroupValues(id) {
    var container = document.getElementById(id);
    if (!container) return "";
    var selected = [];
    container.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
      selected.push(cb.value);
    });
    return selected.join("、");
  }

  /* ═══════════════════════════════════════════════════════
   *  启动
   * ═══════════════════════════════════════════════════════ */
  var hash = window.location.hash || "#login";
  if (localStorage.getItem("token") && (hash === "#login" || hash === "#register")) hash = "#dashboard";
  var initRoute = hash.match(/^(#[a-z-]+)\//) ? RegExp.$1 : hash;
  if (!routes[initRoute]) hash = "#login";
  render(hash);
})();
