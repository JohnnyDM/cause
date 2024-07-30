export default class CauseActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["cause", "sheet", "actor"],
      template: "systems/cause/templates/actor/actor-character-sheet.hbs",
      width: 650,
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

  async _updateObject(event, formData) {
    return this.object.update(formData);
}

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Store the current tab ID
    const storedTab = localStorage.getItem('activeTab');
    console.log('Stored Tab:', storedTab);  // Debugging log
    if (storedTab) {
      CauseActorSheet.showTab(null, storedTab);
    }

    // Add event listeners for tabs
    html.find('.sidebar a').click(event => {
      event.preventDefault();
      const tabId = event.currentTarget.getAttribute('onclick').split("'")[1];
      console.log('Clicked Tab:', tabId);  // Debugging log
      CauseActorSheet.showTab(event, tabId);
      localStorage.setItem('activeTab', tabId);
    });

    html.find('input, select').change(event => this._onChangeInput(event));

    html.find('[data-action="rollStrength"]').click(this._onRollStrength.bind(this));
    html.find('[data-action="rollAgility"]').click(this._onRollAgility.bind(this));
    html.find('[data-action="rollWits"]').click(this._onRollWits.bind(this));
    html.find('[data-action="rollBrains"]').click(this._onRollBrains.bind(this));

    html.find('[data-action="rollSkill"]').click(this._onRollSkill.bind(this));
    html.find('.add-skill').click(this._onAddSkill.bind(this));
    html.find('.edit-skill').click(this._onEditSkill.bind(this));
    html.find('.delete-skill').click(this._onDeleteSkill.bind(this));
    html.find('.skill-level').change(this._onSkillLevelChange.bind(this));
    html.find('.skill-stat').change(this._onSkillStatChange.bind(this));
    html.find('#save-skill').click(this._onSaveSkill.bind(this));
    // Initialize skill level colors
    html.find('.skill-level').each((index, element) => {
      this._updateSkillLevelColor(element);
    });
    html.find('.coreskill-box').hover(this._onHoverBox.bind(this));
    html.find('.weaponskill-box').click(event => {
      if (!$(event.currentTarget).hasClass('selected')) {
          this._onClickWeaponSkillBox(event);
      }
    });
    html.find('.weaponskill-box').hover(
      this._onHoverIn.bind(this),
      this._onHoverOut.bind(this)
  );
    html.find('.delete-weaponskill').click(this._onDeleteWeaponSkill.bind(this));
    html.find('.weaponskill-level').change(this._onWeaponSkillLevelChange.bind(this));

    // Add listeners for coreskills
    html.find('.delete-coreskill').click(this._onDeleteCoreSkill.bind(this));
    html.find('.coreskill-level').change(this._onCoreSkillLevelChange.bind(this));
    html.find('.coreskill-box').click(event => {
        if (!$(event.currentTarget).hasClass('selected')) {
            this._onClickCoreSkillBox(event);
        }
    });

    // Add hover effect only if the coreskill is not selected
    html.find('.coreskill-box').hover(
        this._onHoverIn.bind(this),
        this._onHoverOut.bind(this)
    )

    html.find('.coreskill-name').click(this._onRollCoreSkill.bind(this));
  }

  /** @override */
  async _updateObject(event, formData) {
    // Ensure that the tab state is preserved
    const activeTab = localStorage.getItem('activeTab');
    await super._updateObject(event, formData);
    if (activeTab) {
      CauseActorSheet.showTab(null, activeTab);
    }
  }

  // Add the showTab function as a static method
  static showTab(event, tabId) {
    if (event) event.preventDefault();
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
  }

  _onHoverIn(event) {
    const element = $(event.currentTarget);
    if (!element.hasClass('selected')) {
        element.addClass('highlight');
    }
}

_onHoverOut(event) {
    const element = $(event.currentTarget);
    if (!element.hasClass('selected')) {
        element.removeClass('highlight');
    }
}

_onChangeInput(event) {
  const element = event.currentTarget;
  const value = element.type === "checkbox" ? element.checked : element.value;
  const name = element.name;

  console.log(`Updating actor data: ${name} = ${value}`);
  this.actor.update({ [name]: value });
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
 
  _onAddSkill(event) {
    event.preventDefault();
    const skills = this.actor.system.skills || [];
    skills.push({ skillname: 'Unnamed Skill', skilllevel: 'untrained', stat: 'strength', description: '', isFirearm: false, forFirearm: 'pistol' });
    this.actor.update({ 'system.skills': skills });
}

_onRollSkill(event) {
  event.preventDefault();
  const index = event.currentTarget.closest('.skill').dataset.index;
  const skill = this.actor.system.skills[index];

  // Determine the number of dice based on skill level
  let numDice;
  switch (skill.skilllevel) {
    case 'trained':
      numDice = 4;
      break;
    case 'expert':
      numDice = 6;
      break;
    case 'master':
      numDice = 8;
      break;
    case 'legendary':
      numDice = 10;
      break;
    case 'untrained':
    default:
      numDice = 2;
      break;
  }

  // Map stat to attribute
  const statMapping = {
    strength: 'str',
    agility: 'agi',
    wits: 'wit',
    brains: 'bra'
  };

  const attributeValue = this.actor.system.attributes[statMapping[skill.stat]]?.value || 0;
  const totalDice = numDice + Number(attributeValue);

  const rollFormula = `${totalDice}d6`;
  const roll = new Roll(rollFormula);

  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    flavor: `Rolling for ${skill.skillname} (${skill.skilllevel})`
  });
}

_onEditSkill(event) {
    event.preventDefault();
    const index = event.currentTarget.closest('.skill').dataset.index;
    const skill = this.actor.system.skills[index];

    // Show edit dialog and populate fields
    const dialog = document.getElementById('edit-skill-dialog');
    dialog.style.display = 'block';
    document.getElementById('edit-skill-name').value = skill.skillname;
    document.getElementById('edit-skill-description').value = skill.description;
    document.getElementById('edit-skill-level').value = skill.skilllevel;
    document.getElementById('edit-skill-stat').value = skill.stat;
    //document.getElementById('edit-skill-is-firearm').checked = skill.isFirearm;
    //document.getElementById('edit-skill-for-firearm').value = skill.forFirearm;

    // Save index to the save button for reference
    document.getElementById('save-skill').dataset.index = index;
}

_onDeleteSkill(event) {
    event.preventDefault();
    const index = event.currentTarget.closest('.skill').dataset.index;
    const skills = this.actor.system.skills;
    skills.splice(index, 1);
    this.actor.update({ 'system.skills': skills });
}

_onSaveSkill(event) {
    event.preventDefault();
    const index = event.currentTarget.dataset.index;
    const skills = this.actor.system.skills;
    skills[index] = {
        skillname: document.getElementById('edit-skill-name').value,
        description: document.getElementById('edit-skill-description').value,
        skilllevel: document.getElementById('edit-skill-level').value,
        stat: document.getElementById('edit-skill-stat').value,
        //isFirearm: document.getElementById('edit-skill-is-firearm').checked,
        //forFirearm: document.getElementById('edit-skill-for-firearm').value,
    };
    this.actor.update({ 'system.skills': skills });

    // Hide edit dialog
    document.getElementById('edit-skill-dialog').style.display = 'none';
}

_onSkillLevelChange(event) {
    const index = event.currentTarget.dataset.index;
    const skills = this.actor.system.skills;
    skills[index].skilllevel = event.currentTarget.value;
    this.actor.update({ 'system.skills': skills });

    // Update dropdown color
    this._updateSkillLevelColor(event.currentTarget);
}

_onSkillStatChange(event) {
    const index = event.currentTarget.dataset.index;
    const skills = this.actor.system.skills;
    skills[index].stat = event.currentTarget.value;
    this.actor.update({ 'system.skills': skills });
}

_updateSkillLevelColor(element) {
    const level = element.value;
    element.classList.remove('untrained', 'trained', 'expert', 'master', 'legendary');
    element.classList.add(level);
}
_onHoverBox(event) {
  $(event.currentTarget).toggleClass('highlight');
}

_onClickWeaponSkillBox(event) {
  const skillSlot = event.currentTarget.dataset.skill;
  console.log("Skill Slot:", skillSlot);
  const weaponskillsData = CONFIG.WEAPONSKILLS;
  const container = document.createElement('div');
  container.className = 'weaponskill-options';

  weaponskillsData.forEach((skill) => {
    const skillDiv = document.createElement('div');
    skillDiv.className = 'weaponskill-option';
    if (skill.image) {
      skillDiv.style.backgroundImage = `url('${skill.image}')`;
    }
    const skillSpan = document.createElement('span');
    skillSpan.textContent = skill.type;
    skillDiv.appendChild(skillSpan);
    skillDiv.dataset.skill = skill.type;
    container.appendChild(skillDiv);
  });

  const content = container.outerHTML;
  console.log("Generated Dialog Content:", content);

  const dialog = new Dialog({
    title: "Choose a Weaponskill",
    content: content,
    buttons: {},
    default: "ok",
    render: (html) => {
      html.find('.weaponskill-option').click((event) => {
        const selectedSkillType = event.currentTarget.dataset.skill;
        const selectedSkill = weaponskillsData.find(skill => skill.type === selectedSkillType);
        console.log(`Selected ${selectedSkillType} for ${skillSlot}`);
        this._selectWeaponSkill(selectedSkill, skillSlot);
        dialog.close();
      });
    }
  }).render(true);
}

_selectWeaponSkill(skill, skillSlot) {
  console.log(`_selectWeaponSkill called with skill: ${skill.type}, slot: ${skillSlot}`);
  const updateData = {};
  updateData[`system.${skillSlot}`] = { type: skill.type, level: "untrained" };
  this.actor.update(updateData).then(() => {
      console.log(`Updated ${skillSlot} with`, skill);
      this.render();
  });

  // Entfernen der Highlight-Klasse und Hinzufügen der Selected-Klasse
  const box = $(`[data-skill="${skillSlot}"]`);
  box.removeClass('highlight');
  box.addClass('selected');
}

_onDeleteWeaponSkill(event) {
  event.preventDefault();
  const skillSlot = event.currentTarget.dataset.skill;
  const updateData = {};
  updateData[`system.${skillSlot}`] = { type: "", level: "" };
  this.actor.update(updateData);
  this.render();
}

_onWeaponSkillLevelChange(event) {
  const skillSlot = event.currentTarget.closest('.weaponskill-box').dataset.skill;
  const newValue = event.currentTarget.value;
  let updateData = {};
  updateData[`system.${skillSlot}.level`] = newValue;
  this.actor.update(updateData);
}

_onDeleteCoreSkill(event) {
  event.preventDefault();
  const skillSlot = event.currentTarget.dataset.skill;
  const updateData = {};
  updateData[`system.${skillSlot}`] = { type: "", level: 0 };
  this.actor.update(updateData);
}

_onCoreSkillLevelChange(event) {
  const skillSlot = event.currentTarget.name.replace('coreskill-level', 'coreskills');
  const level = event.currentTarget.value;
  const updateData = {};
  updateData[`system.${skillSlot}.level`] = level;
  this.actor.update(updateData);
}

_onClickCoreSkillBox(event) {
  const skillSlot = event.currentTarget.dataset.skill;
  console.log("Skill Slot:", skillSlot);
  const coreskillsData = CONFIG.CORESKILLS;
  const container = document.createElement('div');
  container.className = 'coreskill-options';

  coreskillsData.forEach((skill) => {
    const skillDiv = document.createElement('div');
    skillDiv.className = 'coreskill-option';
    if (skill.image) {
      skillDiv.style.backgroundImage = `url('${skill.image}')`;
    }
    const skillSpan = document.createElement('span');
    skillSpan.textContent = skill.type;
    skillDiv.appendChild(skillSpan);
    skillDiv.dataset.skill = skill.type;
    container.appendChild(skillDiv);
  });

  const content = container.outerHTML;
  console.log("Generated Dialog Content:", content);

  const dialog = new Dialog({
    title: "Choose a Coreskill",
    content: content,
    buttons: {},
    default: "ok",
    render: (html) => {
      html.find('.coreskill-option').click((event) => {
        const selectedSkillType = event.currentTarget.dataset.skill;
        const selectedSkill = coreskillsData.find(skill => skill.type === selectedSkillType);
        console.log(`Selected ${selectedSkillType} for ${skillSlot}`);
        this._selectCoreSkill(selectedSkill, skillSlot);
        dialog.close();
      });
    }
  }).render(true);
}

_selectCoreSkill(selectedSkill, skillSlot) {
  let updateData = {};
  updateData[`system.${skillSlot}.type`] = selectedSkill.type;
  updateData[`system.${skillSlot}.level`] = "untrained"; // Default level
  updateData[`system.${skillSlot}.stat`] = selectedSkill.stat; // Setting the stat from the config
  this.actor.update(updateData);
}

_onRollCoreSkill(event) {
  event.preventDefault();
  const skillSlot = event.currentTarget.closest('.coreskill-box').dataset.skill;
  const skill = this.actor.system[skillSlot];

  // Determine the number of dice based on skill level
  let numDice;
  switch (skill.level) {
      case 'trained': numDice = 4; break;
      case 'expert': numDice = 6; break;
      case 'master': numDice = 8; break;
      case 'legendary': numDice = 10; break;
      case 'untrained':
      default:
          numDice = 2; break;
  }
  console.log("Stat for the skill:", skill.stat);
  // Add the actor's attribute value actorData.attributes.str.value;
  const attributeValue = this.actor.system.attributes[skill.stat]?.value || 0;
  const totalDice = numDice + Number(attributeValue);
  
  const rollFormula = `${totalDice}d6`;
  const roll = new Roll(rollFormula);

  roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Rolling for ${skill.type} (${skill.level})`
  });
}

}