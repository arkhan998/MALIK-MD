// ======================================================
// TOGGLES REGISTRY — har on/off wala plugin apni halat
// yahan register karta hai, taake .settings sab toggles
// ki current ON/OFF halat ek jagah dikha sake.
// scope: 'global' | 'chat' | 'group'
// getFn(jid) -> true/false
// ======================================================

const registry = [];

function register(key, label, scope, getFn) {
    if (!registry.find(r => r.key === key)) {
        registry.push({ key, label, scope, getFn });
    }
}

function all() {
    return registry;
}

module.exports = { register, all };
