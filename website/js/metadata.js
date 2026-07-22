/* =========================================================
   CloudWithKushagra — EC2 Instance Metadata Script
   ---------------------------------------------------------
   Attempts to read live instance metadata from the AWS
   Instance Metadata Service (IMDSv2) at 169.254.169.254
   when this page is actually being served from an EC2
   instance. Falls back gracefully to a friendly message
   everywhere else (e.g. local preview, non-EC2 hosting)
   since the metadata endpoint is only link-local reachable
   from inside the instance's own network namespace.
   ========================================================= */

(function () {
  var IMDS_BASE = 'http://169.254.169.254/latest';
  var FALLBACK_TEXT = 'Available after deployment on AWS EC2';
  var TIMEOUT_MS = 1200;

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('timeout')); }, ms);
      })
    ]);
  }

  function fetchText(url, headers) {
    return withTimeout(
      fetch(url, { headers: headers || {}, cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('bad status');
        return res.text();
      }),
      TIMEOUT_MS
    );
  }

  function setField(id, value, isPending) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    el.classList.toggle('pending', !!isPending);
  }

  function setAllFallback() {
    ['instance-id', 'availability-zone', 'private-ip', 'public-ip', 'ami-id', 'region']
      .forEach(function (id) { setField(id, FALLBACK_TEXT, true); });
    var badge = document.getElementById('status-badge');
    if (badge) {
      badge.innerHTML = '<span class="pulse-dot"></span> Static preview — connect on EC2 for live data';
      badge.style.background = 'rgba(255,153,0,0.1)';
      badge.style.borderColor = 'rgba(255,153,0,0.35)';
      badge.style.color = 'var(--orange-light)';
    }
  }

  async function loadMetadata() {
    try {
      // IMDSv2 requires a short-lived session token via a PUT request.
      var token = await withTimeout(
        fetch(IMDS_BASE + '/api/token', {
          method: 'PUT',
          headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '21600' }
        }).then(function (r) {
          if (!r.ok) throw new Error('no token');
          return r.text();
        }),
        TIMEOUT_MS
      );

      var authHeader = { 'X-aws-ec2-metadata-token': token };

      var results = await Promise.allSettled([
        fetchText(IMDS_BASE + '/meta-data/instance-id', authHeader),
        fetchText(IMDS_BASE + '/meta-data/placement/availability-zone', authHeader),
        fetchText(IMDS_BASE + '/meta-data/local-ipv4', authHeader),
        fetchText(IMDS_BASE + '/meta-data/public-ipv4', authHeader),
        fetchText(IMDS_BASE + '/meta-data/ami-id', authHeader),
        fetchText(IMDS_BASE + '/meta-data/placement/region', authHeader)
      ]);

      var [instanceId, az, privateIp, publicIp, amiId, region] = results;

      setField('instance-id', instanceId.status === 'fulfilled' ? instanceId.value : FALLBACK_TEXT, instanceId.status !== 'fulfilled');
      setField('availability-zone', az.status === 'fulfilled' ? az.value : FALLBACK_TEXT, az.status !== 'fulfilled');
      setField('private-ip', privateIp.status === 'fulfilled' ? privateIp.value : FALLBACK_TEXT, privateIp.status !== 'fulfilled');
      setField('public-ip', publicIp.status === 'fulfilled' ? publicIp.value : 'Not assigned / behind Load Balancer', publicIp.status !== 'fulfilled');
      setField('ami-id', amiId.status === 'fulfilled' ? amiId.value : FALLBACK_TEXT, amiId.status !== 'fulfilled');
      setField('region', region.status === 'fulfilled' ? region.value : FALLBACK_TEXT, region.status !== 'fulfilled');

      var anySuccess = results.some(function (r) { return r.status === 'fulfilled'; });
      var badge = document.getElementById('status-badge');
      if (badge && anySuccess) {
        badge.innerHTML = '<span class="pulse-dot"></span> Live — metadata detected from this EC2 instance';
      } else if (badge) {
        setAllFallback();
      }
    } catch (err) {
      setAllFallback();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('instance-id')) return; // not on status page
    setAllFallback(); // optimistic default while we probe
    loadMetadata();

    var refreshBtn = document.getElementById('refresh-metadata');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        setAllFallback();
        loadMetadata();
      });
    }
  });
})();
