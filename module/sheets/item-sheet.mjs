export default class CauseItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['cause', 'sheet', 'item'],
      width: 273,
      height: 370,
      tabs: [
        {
          navSelector: '.weapontabs',
          contentSelector: '.weaponcontent',
          initial: 'desc',
        },
      ],
    });
  }

  get template() {
    return `systems/cause/templates/item/item-${this.item.type}.hbs`;
  }

  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = this.item.getRollData();

    // Add the item's data to context for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.tab-buttons li').click(this._onTabClick.bind(this));
  }

  _onTabClick(event) {
    event.preventDefault();
    const tab = $(event.currentTarget).data('tab');
    this.element.find('.tab-buttons li').removeClass('active');
    this.element.find('.tab-content').removeClass('active');
    this.element.find(`.tab-buttons li[data-tab="${tab}"]`).addClass('active');
    this.element.find(`#${tab}`).addClass('active');
  }
}

// Unregister the default item sheet
Items.unregisterSheet("core", ItemSheet);

// Register the custom item sheet
Items.registerSheet("cause", CauseItemSheet, { makeDefault: true });