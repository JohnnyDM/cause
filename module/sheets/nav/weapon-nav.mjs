export class WeaponNav extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            height: 600,
            width: 400,
            template: "systems/cause/templates/item/part/weapon-nav.hbs",
            title: 'weapon.browser.nav',
            tabs: [{ navSelector: ".weapon-docs", contentSelector: ".weapon-doc-col", initial: "Actor" }],
        })
    }

    async getData(options={}){
        let context = {}
        // Populate the context with all the vault data per-type, adding the UUID for each
        Object.entries(vault._cache).reduce((c,[type,docs]) => {c[type] = docs.map(a => ({uuid: `${type}.${a.id}`, ...a})); return c}, context)
        context.doc_types = Object.entries(vault._cache).filter(i => i[1].length>0).map(i => i[0])
        //#context.actors = vault._cache.Actor.map(a => ({uuid: `Actor.${a.id}`, ...a}))
        return context
    }

    activateListeners(html){
        super.activateListeners(html)

        // Add a context menu
        ContextMenu.create(this, html, 'li.weapon-doc', [
            {
                name:'weapon.desc', 
                icon: '<i class="fa-solid fa-upload"></i>', 
                condition: li => fromUuidSync(li.data('uuid')), 
                callback: li=>vault.pushDocument(li.data('uuid'))
            },
            {
                name:'weapon.details', 
                icon: '<i class="fa-solid fa-upload"></i>', 
                condition: li => fromUuidSync(li.data('uuid')), 
                callback: li=>vault.pushDocument(li.data('uuid'))
            }
        ])
    }
}
