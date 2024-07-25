export default class CauseActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["cause", "sheet", "actor"],
      template: "systems/cause/templates/actor/actor-character-sheet.hbs",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  getData() {
    const data = super.getData();
    data.system = data.actor.system;
    data.system.attributes = data.actor.system.attributes || {};
    data.system.abilities = data.actor.system.abilities || {};

    // Bereite die Skill-Items vor
    data.items = this._prepareSkills(data.items);

    return data;
  }

  /**
   * Bereitet die Skill-Items vor und teilt sie in zwei Spalten auf.
   * @param {Array} items - Die Items des Actors.
   * @returns {Array} - Die vorbereiteten Skill-Items.
   */
  _prepareSkills(items) {
    const skillItems = items.filter(item => item.type === "skill");
    const columns = [[], []];
    skillItems.forEach((item, index) => {
      columns[index % 2].push(item);
    });
    return columns.flat();
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find('[data-action="rollStrength"]').click(this._onRollStrength.bind(this));
    html.find('[data-action="rollAgility"]').click(this._onRollAgility.bind(this));
    html.find('[data-action="rollWits"]').click(this._onRollWits.bind(this));
    html.find('[data-action="rollBrains"]').click(this._onRollBrains.bind(this));
    html.on('click', '.delete-skill', this._onDeleteSkill.bind(this));
    html.on('change', '.skill-level', this._onSkillLevelChange.bind(this));
    html.find('.skill-level').each((_, select) => {
      this._initializeSkillLevel(select);
      this._updateSkillLevelColor(select);
    });
    html.on('click', '.edit-skill', this._onEditSkill.bind(this));
  }

  /**
   * Führt einen Stärkewurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
  _onRollStrength(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    const strength = actorData.attributes.str.value;
    const rollFormula = `${strength}d6cs>=4df=1x=6cs>=4`;
    const roll = new Roll(rollFormula);

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Rolling for ${strength} Strength`
    });
  }

  /**
   * Führt einen Agilitätswurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
  _onRollAgility(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    const agility = actorData.attributes.agi.value;
    const rollFormula = `${agility}d6cs>=4df=1x=6cs>=4`;
    const roll = new Roll(rollFormula);

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Rolling for ${agility} Agility`
    });
  }

  /**
   * Führt einen Witzwurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
  _onRollWits(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    const wits = actorData.attributes.wit.value;
    const rollFormula = `${wits}d6cs>=4df=1x=6cs>=4`;
    const roll = new Roll(rollFormula);

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Rolling for ${wits} Wits`
    });
  }

  /**
   * Führt einen Intelligenzwurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
  _onRollBrains(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    const brains = actorData.attributes.bra.value;
    const rollFormula = `${brains}d6cs>=4df=1x=6cs>=4`;
    const roll = new Roll(rollFormula);

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Rolling for ${brains} Brains`
    });
  }

  /**
   * Löscht ein Skill-Item.
   * @param {Event} event - Das auslösende Ereignis.
   */
  async _onDeleteSkill(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const itemId = button.dataset.itemId;
    if (!itemId) {
      ui.notifications.error("Item ID fehlt.");
      return;
    }

    const skill = this.actor.items.get(itemId);
    if (!skill) {
      ui.notifications.error("Skill nicht gefunden.");
      return;
    }

    await skill.delete();
  }

  /**
   * Ändert das Skill-Level eines Skill-Items.
   * @param {Event} event - Das auslösende Ereignis.
   */
  async _onSkillLevelChange(event) {
    const select = event.currentTarget;
    const itemId = select.dataset.itemId;
    if (!itemId) {
      ui.notifications.error("Item ID fehlt.");
      return;
    }

    const skill = this.actor.items.get(itemId);
    if (!skill) {
      ui.notifications.error("Skill nicht gefunden.");
      return;
    }

    const newLevel = parseInt(select.value);
    await skill.update({ 'system.skillLevel': newLevel });

    this._updateSkillLevelColor(select);
  }

  /**
   * Aktualisiert die Farbe des Skill-Levels basierend auf dessen Wert.
   * @param {HTMLSelectElement} select - Das Dropdown-Element.
   */
  _updateSkillLevelColor(select) {
    const level = parseInt(select.value);
    const classes = ['untrained', 'trained', 'expert', 'master', 'legendary'];
    select.classList.remove(...classes);
    if (level >= 1 && level <= 5) {
      select.classList.add(classes[level - 1]);
    }
  }

  /**
   * Initialisiert das Skill-Level eines Dropdowns.
   * @param {HTMLSelectElement} select - Das Dropdown-Element.
   */
  _initializeSkillLevel(select) {
    const itemId = select.dataset.itemId;
    const skill = this.actor.items.get(itemId);
    if (skill) {
      select.value = skill.system.skillLevel;
      this._updateSkillLevelColor(select);
    }
  }

  /**
   * Öffnet das Skill-Item zur Bearbeitung.
   * @param {Event} event - Das auslösende Ereignis.
   */
  async _onEditSkill(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const itemId = button.dataset.itemId;
    if (!itemId) {
      ui.notifications.error("Item ID fehlt.");
      return;
    }

    const skill = this.actor.items.get(itemId);
    if (!skill) {
      ui.notifications.error("Skill nicht gefunden.");
      return;
    }

    skill.sheet.render(true);
  }
}
