export class CauseClassItemSheet extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ['cause', 'sheet', 'item'],
        width: 400,
        height: 500,
        tabs: [
            {
            navSelector: '.sheet-tabs',
            contentSelector: '.sheet-body',
            initial: 'description',
            },
        ],
        });
    }

    get template() {
        const path = 'systems/cause/templates';
        return `${path}/item-${this.item.type}-sheet.hbs`;
    }

    getData() {
        // Retrieve base data structure.
        const context = super.getData();
      
        // Use a safe clone of the item data for further operations.
        const itemData = context.data;
      
        // Retrieve the roll data for TinyMCE editors.
        context.rollData = this.item.getRollData();
      
        // Add the item's data to context.data for easier access, as well as flags.
        context.system = itemData.system;
        context.flags = itemData.flags;
        console.log(context.system);
        return context;
      }

    /** @override */
    activateEditor(name, options = {}, initialContent = "") {
      options.engine = "prosemirror"; // Standard-Editor ab Version 10+
      super.activateEditor(name, options, initialContent);
    }

    activateListeners(html) {
      super.activateListeners(html);
    
      // Everything below here is only needed if the sheet is editable
      if (!this.isEditable) return;
    
      // Roll handlers, click handlers, etc. would go here.
    
      // Active Effect management
      html.on('click', '.effect-control', (ev) =>
        onManageActiveEffect(ev, this.item)
      );
    }

}