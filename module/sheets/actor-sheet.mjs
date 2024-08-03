export default class CauseActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["cause", "sheet", "actor"],
      template: "systems/cause/templates/actor/actor-character-sheet.hbs",
      width: 650,
      height: 650,
      tabs: [{ navSelector: ".causenavtabs", contentSelector: ".causecontent", initial: "core" }, { navSelector: ".inventorynavtabs", contentSelector: ".inventorycontent", initial: "weapons" }]
    });
  }

  /** @override */
  getData() {
    const data = super.getData();
    data.system = data.actor.system;
    data.system.attributes = data.actor.system.attributes || {};
    data.system.abilities = data.actor.system.abilities || {};

    // Bereite die Skill-Items vor
    //data.items = this._prepareSkills(data.items);
    
    console.log("Formpoints:", data.system.core.formpoints);
    this._prepareItems(data);

    // Standardbildpfad
    const defaultImage = 'systems/cause/assets/blank-black.png';

    // Liste der Coreskills
    const coreskills = [
      'coreskills1', 'coreskills2', 'coreskills3', 'coreskills4', 
      'coreskills5', 'coreskills6', 'coreskills7', 'coreskills8'
    ];

    // Überprüfe die nicht ausgewählten Coreskills und setze das Standardbild
    coreskills.forEach(skill => {
      // Initialisiere den Coreskill, falls er nicht existiert
      if (!data.system[skill]) {
        data.system[skill] = { type: "", img: defaultImage };
      }
      if (!data.system[skill].type) {
        data.system[skill].img = defaultImage;
      }
    });

      // Liste der Waffenfertigkeiten
    const weaponskills = [
      'weaponskills1', 'weaponskills2', 'weaponskills3'
    ];

    // Überprüfe die nicht ausgewählten Waffenfertigkeiten und setze das Standardbild
    weaponskills.forEach(skill => {
      // Initialisiere die Waffenfertigkeit, falls sie nicht existiert
      if (!data.system[skill]) {
        data.system[skill] = { type: "", img: defaultImage };
      }
      if (!data.system[skill].type) {
        data.system[skill].img = defaultImage;
      }
    });

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

    html.find('input, select').change(event => this._onChangeInput(event));

    html.find('[data-action="rollStrength"]').click(this._onRollStrength.bind(this));
    html.find('[data-action="rollAgility"]').click(this._onRollAgility.bind(this));
    html.find('[data-action="rollWits"]').click(this._onRollWits.bind(this));
    html.find('[data-action="rollBrains"]').click(this._onRollBrains.bind(this));

    // Right-click to show bonus dice dialog
    html.find('[data-action="rollStrength"]').contextmenu(this._onShowBonusDialog.bind(this, 'str'));
    html.find('[data-action="rollAgility"]').contextmenu(this._onShowBonusDialog.bind(this, 'agi'));
    html.find('[data-action="rollWits"]').contextmenu(this._onShowBonusDialog.bind(this, 'wit'));
    html.find('[data-action="rollBrains"]').contextmenu(this._onShowBonusDialog.bind(this, 'bra'));

    html.find('[data-action="rollFormpoints"]').click(this._onRollFormpoints.bind(this));

    Hooks.on('renderChatMessage', (app, html, data) => {
      html.find('.push-your-luck-button').click(event => this._onPushYourLuck(event));
  });

  html.find('.item-name').contextmenu(event => {
    const itemId = $(event.currentTarget).closest('.item').data('item-id');
    this._onShowWeaponBonusDialog(itemId, event);
  });
    html.on('click', '.item-create', this._onItemCreate.bind(this));
    html.find('[data-action="rollSkill"]').click(this._onRollSkill.bind(this));
    html.find('.add-skill').click(this._onAddSkill.bind(this));
    html.find('.edit-skill').click(this._onEditSkill.bind(this));
    html.find('.delete-skill').click(this._onDeleteSkill.bind(this));
    html.find('.skill-level').change(this._onSkillLevelChange.bind(this));
    html.find('.skill-stat').change(this._onSkillStatChange.bind(this));
    html.find('#save-skill').click(this._onSaveSkill.bind(this));
    html.find('.weapon-roll').click(this._onWeaponRoll.bind(this));
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
    // Add hover effect for skill names
    html.find('.skill-name').hover(
      (event) => {
        $(event.currentTarget).addClass('highlight');
      },
      (event) => {
        $(event.currentTarget).removeClass('highlight');
      }
    );
    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });
  
    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Listener for right-click on core skills and skills
    html.find('.coreskill-box .coreskill-name').contextmenu(event => {
      event.preventDefault();
      const skillSlot = $(event.currentTarget).closest('.coreskill-box').data('skill');
      const skill = this.actor.system[skillSlot];
      console.log("Core skill slot:", skillSlot); // Konsolenausgabe für Debugging
      console.log("Core skill:", skill); // Konsolenausgabe für Debugging
      this._onShowSkillBonusDialog(skill, skill.stat, event);
  });

  html.find('.skill-name').contextmenu(event => {
    event.preventDefault();
    const skillSlot = $(event.currentTarget).closest('.skill').data('index');
    const skill = this.actor.system.skills[skillSlot];
    console.log("Skill slot:", skillSlot); // Konsolenausgabe für Debugging
    console.log("Skill:", skill); // Konsolenausgabe für Debugging
    this._onShowSkillBonusDialog(skill, skill.stat, event);
});

  html.on('click', '.item-delete', (ev) => {
    const li = $(ev.currentTarget).parents('.item');
    const item = this.actor.items.get(li.data('itemId'));
    item.delete();
    li.slideUp(200, () => this.render(false));
  });
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

    html.find('.coreskill-name').click(this._rollCoreSkill.bind(this));

    html.find('.add-skill').contextmenu(event => {
      event.preventDefault();
      this._onRightClickAddSkill(event);
    });
  }

  _onRightClickAddSkill(event) {
    const skillsData = CONFIG.SKILLS;

    // Mapping von stat zu Attributnamen
    const statMapping = {
        str: "strength",
        agi: "agility",
        wit: "wits",
        bra: "brains"
    };

    // Container für die Skills erstellen
    const container = document.createElement('div');
    container.className = 'skills-options';
    const columns = [];
    let column = document.createElement('div');
    column.className = 'skills-column';
    let skillsInColumn = 0;

    skillsData.forEach((skill, index) => {
        if (skillsInColumn === 10) {
            columns.push(column);
            column = document.createElement('div');
            column.className = 'skills-column';
            skillsInColumn = 0;
        }

        const skillDiv = document.createElement('div');
        skillDiv.className = 'skill-option';
        if (skill.image) {
            skillDiv.style.backgroundImage = `url('${skill.image}')`;
        }
        const skillSpan = document.createElement('span');
        const skillStat = statMapping[skill.stat] || 'strength'; // Mapping von stat
        skillSpan.innerHTML = `${skill.type} (${skillStat})`;
        skillDiv.appendChild(skillSpan);
        skillDiv.dataset.skill = skill.type;
        skillDiv.dataset.image = skill.image || 'path/to/default_image.png'; // Standardbild, falls nicht vorhanden
        skillDiv.dataset.stat = skillStat;
        column.appendChild(skillDiv);

        skillsInColumn++;
    });

    columns.push(column); // Letzte Spalte hinzufügen
    columns.forEach(col => container.appendChild(col)); // Spalten zum Container hinzufügen

    const content = container.outerHTML;

    const dialog = new Dialog({
        title: "Choose a Skill",
        content: content,
        buttons: {},
        default: "ok",
        render: (html) => {
            // Passe die Breite des Dialogs an die Breite des Inhalts an
            const dialogContent = html.closest('.window-content');
            dialogContent.css('width', 'auto');
            dialogContent.css('max-width', 'none'); // Entfernt die maximale Breite
            dialogContent.css('height', 'auto'); // Passe die Höhe an den Inhalt an

            html.find('.skill-option').click((event) => {
                const selectedSkill = {
                    type: event.currentTarget.dataset.skill,
                    image: event.currentTarget.dataset.image,
                    skillname: event.currentTarget.dataset.skill,
                    description: '',
                    skilllevel: 'untrained',
                    stat: event.currentTarget.dataset.stat
                };
                console.log("Selected skill:", selectedSkill);

                // Konvertiere das skills Objekt in ein Array
                const skillsObj = this.actor.system.skills || {};
                const skills = Object.values(skillsObj);

                // Nächsten freien Index finden
                let nextFreeIndex = skills.findIndex(skill => !skill.skillname);
                if (nextFreeIndex === -1) {
                    nextFreeIndex = skills.length;
                }

                // Skill zum nächsten freien Index hinzufügen
                skills[nextFreeIndex] = {
                    type: selectedSkill.type,
                    image: selectedSkill.image,
                    skillname: selectedSkill.skillname,
                    description: selectedSkill.description,
                    skilllevel: selectedSkill.skilllevel,
                    stat: selectedSkill.stat
                };

                // Konvertiere das Array zurück in ein Objekt mit numerischen Schlüsseln
                const newSkillsObj = {};
                skills.forEach((skill, index) => {
                    newSkillsObj[index] = skill;
                });

                this.actor.update({ 'system.skills': newSkillsObj }).then(() => {
                    console.log("Updated actor data with new skill:", newSkillsObj);
                    dialog.close();
                });
            });
        }
    }, { classes: ["skill-wider-dialog"], width: 1200 }).render(true); // Setze die Klasse und die Breite hier
}

  _onShowSkillBonusDialog(skill, stat, event) {
    event.preventDefault();
    console.log("Entering _onShowSkillBonusDialog"); // Konsolenausgabe, um sicherzustellen, dass die Methode aufgerufen wird
    console.log("Skill passed to _onShowSkillBonusDialog:", skill); // Konsolenausgabe des übergebenen Skills
    console.log("Stat passed to _onShowSkillBonusDialog:", stat); // Konsolenausgabe des übergebenen Stats

    // Überprüfen, ob der Skill und der Stat vorhanden sind
    if (!skill || (!skill.type && !skill.skillname)) {
        console.error("Skill or skill.type/skill.skillname is undefined:", skill);
        return;
    }

    const actorData = this.actor.system;
    const skillName = skill.type || skill.skillname;
    console.log(skillName);
    const skillStat = stat || skill.stat;
    const skillLevel = skill.level || skill.skilllevel;

    new Dialog({
      title: `Add Bonus Dice ${skillName}`,
      content: `
        <form>
          <div class="form-group">
            <label>Attribute:</label>
            <div class="attribute-buttons">
              <button type="button" class="attribute-button" data-attribute="str" ${skillStat === "str" ? 'class="active"' : ''}>Strength</button>
              <button type="button" class="attribute-button" data-attribute="agi" ${skillStat === "agi" ? 'class="active"' : ''}>Agility</button>
              <button type="button" class="attribute-button" data-attribute="wit" ${skillStat === "wit" ? 'class="active"' : ''}>Wits</button>
              <button type="button" class="attribute-button" data-attribute="bra" ${skillStat === "bra" ? 'class="active"' : ''}>Brains</button>
            </div>
          </div>
          <div class="form-group">
            <label>Form Points:</label>
            <div class="form-points-input">
              <button type="button" class="decrease-form-points">-</button>
              <input type="number" name="form-points" min="0" value="0" max="${actorData.core.formpoints.value}">
              <button type="button" class="increase-form-points">+</button>
            </div>
          </div>
          <div class="form-group">
            <label>Bonus Dice:</label>
            <div class="bonus-dice-input">
              <button type="button" class="decrease-bonus-dice">-</button>
              <input type="number" name="bonus-dice" min="0" value="0">
              <button type="button" class="increase-bonus-dice">+</button>
            </div>
          </div>
        </form>
      `,
      buttons: {
        roll: {
          label: "Roll",
          callback: (html) => {
            const bonusDice = parseInt(html.find('[name="bonus-dice"]').val(), 10);
            const formPoints = parseInt(html.find('[name="form-points"]').val(), 10);
            const selectedAttribute = html.find('.attribute-button.active').data('attribute') || skillStat;
            this._rollSkillWithBonus(skill, selectedAttribute, bonusDice, formPoints);
          }
        }
      },
      default: "roll",
      render: (html) => {
        html.find('.attribute-button').click((event) => {
          html.find('.attribute-button').removeClass('active');
          $(event.currentTarget).addClass('active');
        });

        html.find('.decrease-form-points').click((event) => {
          const input = html.find('[name="form-points"]');
          let value = parseInt(input.val(), 10);
          if (value > 0) input.val(--value);
        });
        html.find('.increase-form-points').click((event) => {
          const input = html.find('[name="form-points"]');
          let value = parseInt(input.val(), 10);
          if (value < actorData.core.formpoints.value) input.val(++value);
        });
        html.find('.decrease-bonus-dice').click((event) => {
          const input = html.find('[name="bonus-dice"]');
          let value = parseInt(input.val(), 10);
          if (value > 0) input.val(--value);
        });
        html.find('.increase-bonus-dice').click((event) => {
          const input = html.find('[name="bonus-dice"]');
          let value = parseInt(input.val(), 10);
          input.val(++value);
        });
      }
    }).render(true);
}
_rollSkillWithBonus(skill, stat, bonusDice, formPoints) {
  const skillLevelMap = {
      'untrained': 2,
      'trained': 4,
      'expert': 6,
      'master': 8,
      'legendary': 10
  };
  const skillStat = {
    'wit': 'wit',
    'str': 'str',
    'agi': 'agi',
    'bra': 'bra',
    'strength': 'str',
    'agility': 'agi',
    'wits': 'wit',
    'brains': 'bra'
};
  console.error("Stat:", stat);
  const numDice = skillLevelMap[skill.level] || 2;
  const attributeValue = this.actor.system.attributes[skillStat[stat]]?.value || 0;
  const totalDice = numDice + Number(attributeValue) + Number(bonusDice) + Number(formPoints);

  const rollFormula = `${totalDice}d6cs>=4df=1x=6cs>=4df=1`;
  const roll = new Roll(rollFormula);

  roll.roll({async: true}).then(result => {
      console.log("Roll formula:", roll.formula);
      console.log("Roll results:", roll);

      // Generating a unique ID for the roll
      const rollId = randomID();

      const critSuccessImg = 'systems/cause/assets/crit_success.png';
      const successImg = 'systems/cause/assets/success.png';
      const failureImg = 'systems/cause/assets/failure.png';

      let critSuccesses = 0;
      let successes = 0;
      let failures = 0;

      if (roll.dice && roll.dice[0] && roll.dice[0].results) {
          roll.dice[0].results.forEach(result => {
              if (result.result === 6) {
                  critSuccesses++;
              } else if (result.result >= 4) {
                  successes++;
              } else if (result.result === 1) {
                  failures++;
              }
          });
      } else {
          console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
      }

      const critSuccessImages = critSuccesses > 0 ? 
          Array(critSuccesses).fill(`<img src="${critSuccessImg}" alt="Critical Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const successImages = successes > 0 ? 
          Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const failureImages = failures > 0 ? 
          Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const messageContent = `
          <div class="chat-message">
              <div class="message-content">
                  <div class="attribute-name">${skill.type || skill.skillname} (${stat})</div>
                  <div class="footer-line"></div>
                  <div class="results-line">${critSuccessImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${successImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${failureImages}</div>
                  <div class="footer-line"></div>
                  <div class="result-total">Total Result: ${roll.total}</div>
                  <button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
              </div>
          </div>
      `;
      console.log("Chat message created with rollId:", rollId);

      // Integration with Dice So Nice
      game.dice3d?.showForRoll(roll, game.user, true).then(() => {
          ChatMessage.create({
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: messageContent,
              roll: roll,
              flags: { rollId: rollId }
          });
      });
  }).catch(error => {
      console.error("Fehler beim Würfeln:", error);
  });
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

async _onWeaponRoll(event) {
  event.preventDefault();
  const itemId = event.currentTarget.dataset.itemId;
  const item = this.actor.items.get(itemId);
  const weaponType = item.system.weaponType;
  const weaponLevel = parseInt(item.system.weaponLevel) || 0;

  // Suche nach dem passenden Weaponskill
  const weaponSkills = [this.actor.system.weaponskills1, this.actor.system.weaponskills2];
  const matchingSkill = weaponSkills.find(skill => skill.type.toLowerCase() === weaponType.toLowerCase());

  if (!matchingSkill) {
    ui.notifications.warn(`No matching Weaponskill found for weapon type: ${weaponType}`);
    return;
  }

  // Berechne die Anzahl der Würfel basierend auf dem Level
  let skillLevel;
  switch (matchingSkill.level) {
    case 'trained': skillLevel = 4; break;
    case 'expert': skillLevel = 6; break;
    case 'master': skillLevel = 8; break;
    case 'legendary': skillLevel = 10; break;
    case 'untrained':
    default:
      skillLevel = 2; break;
  }

  const characterLevel = this.actor.system.core.level.value || 0;

  // Bestimme die zusätzlichen Würfel basierend auf dem Charakterlevel
  let bonusDice = 0;
  if (characterLevel >= 1 && characterLevel <= 3) {
    bonusDice = 1;
  } else if (characterLevel >= 4 && characterLevel <= 6) {
    bonusDice = 2;
  } else if (characterLevel >= 7 && characterLevel <= 9) {
    bonusDice = 3;
  } else if (characterLevel >= 10 && characterLevel <= 12) {
    bonusDice = 4;
  } else if (characterLevel >= 13 && characterLevel <= 15) {
    bonusDice = 5;
  }

  // Bestimme den höheren Wert von Strength und Agility, teile ihn durch 2 und runde ab
  const strength = this.actor.system.attributes.str.value || 0;
  const agility = this.actor.system.attributes.agi.value || 0;
  const higherStat = Math.floor(Math.max(strength, agility) / 2);

  // Berechne die Gesamtdice
  const totalDice = skillLevel + weaponLevel + bonusDice + higherStat;

  // Erstelle und führe den Wurf aus
  const rollFormula = `${totalDice}d6cs>=4df=1x=6cs>=4df=1`;
  const roll = new Roll(rollFormula);

  roll.roll({ async: true }).then(result => {
    console.log("Roll formula:", roll.formula);
    console.log("Roll results:", roll);

    // Generating a unique ID for the roll
    const rollId = randomID();

    const critSuccessImg = 'systems/cause/assets/crit_success.png';
    const successImg = 'systems/cause/assets/success.png';
    const failureImg = 'systems/cause/assets/failure.png';

    let critSuccesses = 0;
    let successes = 0;
    let failures = 0;

    if (roll.dice && roll.dice[0] && roll.dice[0].results) {
      roll.dice[0].results.forEach(result => {
        if (result.result === 6) {
          critSuccesses++;
        } else if (result.result >= 4) {
          successes++;
        } else if (result.result === 1) {
          failures++;
        }
      });
    } else {
      console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
    }

    const critSuccessImages = critSuccesses > 0 ? 
      Array(critSuccesses).fill(`<img src="${critSuccessImg}" alt="Critical Success" class="result-img">`).join('') : 
      `<div class="none-text">None</div>`;

    const successImages = successes > 0 ? 
      Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
      `<div class="none-text">None</div>`;

    const failureImages = failures > 0 ? 
      Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
      `<div class="none-text">None</div>`;

    const messageContent = `
      <div class="chat-message">
        <div class="message-content">
          <div class="attribute-name">${item.name} (${weaponType})</div>
          <div class="footer-line"></div>
          <div class="results-line">${critSuccessImages}</div>
          <div class="separator-line"></div>
          <div class="results-line">${successImages}</div>
          <div class="separator-line"></div>
          <div class="results-line">${failureImages}</div>
          <div class="footer-line"></div>
          <div class="result-total">Total Result: ${roll.total}</div>
          <button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
        </div>
      </div>
    `;
    console.log("Chat message created with rollId:", rollId);

    // Integration with Dice So Nice
    game.dice3d?.showForRoll(roll, game.user, true).then(() => {
      ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: messageContent,
        roll: roll,
        flags: { rollId: rollId }
      });
    });
  }).catch(error => {
    console.error("Fehler beim Würfeln:", error);
  });
}


_prepareItems(data) {
  // Initialize containers.
  const weapon = [];

  // Iterate through items, allocating to containers
  for (let i of data.items) {
    i.img = i.img || DEFAULT_TOKEN;
    // Append to gear.
    if (i.type === 'weapon') {
      weapon.push(i);
    }
  }

  // Assign and return
  data.weapon = weapon;
}

_onChangeInput(event) {
  const element = event.currentTarget;
  const value = element.type === "checkbox" ? element.checked : element.value;
  const name = element.name;

  console.log(`Updating actor data: ${name} = ${value}`);
  this.actor.update({ [name]: value });
}

async _onItemCreate(event) {
  event.preventDefault();
  const header = event.currentTarget;
  // Get the type of item to create.
  const type = header.dataset.type;
  // Grab any data associated with this control.
  const data = duplicate(header.dataset);
  // Initialize a default name.
  const name = `New ${type.capitalize()}`;
  // Prepare the item object.
  const itemData = {
    name: name,
    type: type,
    system: data,
  };
  // Remove the type from the dataset since it's in the itemData.type prop.
  delete itemData.system['type'];

  // Finally, create the item!
  return await Item.create(itemData, { parent: this.actor });
}

  /**
   * Führt einen Attributswurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
  _onRollStrength(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    this._rollAttribute('str', actorData.attributes.str.value);
  }

  _onRollAgility(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    this._rollAttribute('agi', actorData.attributes.agi.value);
  }

  _onRollWits(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    this._rollAttribute('wit', actorData.attributes.wit.value);
  }

  _onRollBrains(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    this._rollAttribute('bra', actorData.attributes.bra.value);
  }
 
  _rollAttribute(attr, baseValue, bonusDice = 0, formPoints = 0) {
    const attributeMap = {
        str: "Strength",
        agi: "Agility",
        wit: "Wits",
        bra: "Brains"
    };

    const fullAttrName = attributeMap[attr] || attr;

    const totalDice = Number(baseValue) + Number(bonusDice) + Number(formPoints);
    const rollFormula = `${totalDice}d6cs>=4df1x6cs>=4df1`;
    const roll = new Roll(rollFormula);

    roll.roll({async: true}).then(result => {
        console.log("Roll formula:", roll.formula);
        console.log("Roll results:", roll);
        
        // Generating a unique ID for the roll
        const rollId = randomID();

        const critSuccessImg = 'systems/cause/assets/crit_success.png';
        const successImg = 'systems/cause/assets/success.png';
        const failureImg = 'systems/cause/assets/failure.png';

        let critSuccesses = 0;
        let successes = 0;
        let failures = 0;

        if (roll.dice && roll.dice[0] && roll.dice[0].results) {
            roll.dice[0].results.forEach(result => {
                if (result.result === 6) {
                    critSuccesses++;
                } else if (result.result >= 4) {
                    successes++;
                } else if (result.result === 1) {
                    failures++;
                }
            });
        } else {
            console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
        }

        const critSuccessImages = critSuccesses > 0 ? 
            Array(critSuccesses).fill(`<img src="${critSuccessImg}" alt="Critical Success" class="result-img">`).join('') : 
            `<div class="none-text">None</div>`;

        const successImages = successes > 0 ? 
            Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
            `<div class="none-text">None</div>`;

        const failureImages = failures > 0 ? 
            Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
            `<div class="none-text">None</div>`;

        const messageContent = `
            <div class="chat-message">
                <div class="message-content">
                    <div class="attribute-name">${fullAttrName}</div>
                    <div class="footer-line"></div>
                    <div class="results-line">${critSuccessImages}</div>
                    <div class="separator-line"></div>
                    <div class="results-line">${successImages}</div>
                    <div class="separator-line"></div>
                    <div class="results-line">${failureImages}</div>
                    <div class="footer-line"></div>
                    <div class="result-total">Total Result: ${roll.total}</div>
                    <button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
                </div>
            </div>
        `;
        console.log("Chat message created with rollId:", rollId);
        // Integration with Dice So Nice
        game.dice3d?.showForRoll(roll, game.user, true).then(() => {
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: messageContent,
                roll: roll,
                flags: { rollId: rollId }
            });
        });
    }).catch(error => {
        console.error("Fehler beim Würfeln:", error);
    });
}
_onPushYourLuck(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const rollId = button.dataset.rollId;
  const originalResult = parseInt(button.dataset.originalResult, 10);
  console.log("Push your Luck button clicked. Roll ID:", rollId, "Original Result:", originalResult);

  // Find the original message using the rollId
  const originalMessage = game.messages.find(msg => msg.flags.rollId === rollId);

  if (!originalMessage) {
      console.error("Original message not found");
      return;
  }

  const roll = new Roll('10d6cs>=4df<=3');
  roll.roll({async: true}).then(result => {
      console.log("Push your Luck roll:", roll);

      let successes = 0;
      let failures = 0;

      if (roll.dice && roll.dice[0] && roll.dice[0].results) {
          roll.dice[0].results.forEach(result => {
              if (result.result >= 4) {
                  successes++;
              } else {
                  failures++;
              }
          });
      } else {
          console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
      }

      const successImg = 'systems/cause/assets/success.png';
      const failureImg = 'systems/cause/assets/failure.png';

      const successImages = successes > 0 ? 
          Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const failureImages = failures > 0 ? 
          Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      // Determine the luck message
      const luckResult = successes - failures;
      let luckMessage;
      if (luckResult === 0) {
          luckMessage = "You are neither lucky nor unlucky";
      } else if (luckResult > 0) {
          luckMessage = "You are rather lucky";
      } else {
          luckMessage = "You are rather unlucky";
      }

      const newTotalResult = originalResult + roll.total;
      console.log(`original: ${originalResult}.. roll: ${roll.total}`, roll);
      const luckRollContent = `
          <div class="attribute-name">Pushing your Luck</div>
          <div class="separator-line"></div>
          <div class="results-line">${successImages}</div>
          <div class="separator-line"></div>
          <div class="results-line">${failureImages}</div>
          <div class="separator-line"></div>
          <div class="luck-message">${luckMessage}</div>
          <div class="result-total">Total Result: ${newTotalResult}</div>
      `;

      // Integration with Dice So Nice
      game.dice3d?.showForRoll(roll, game.user, true).then(() => {
          const originalContent = originalMessage.content;

          // Remove the previous total result line
          const updatedContent = originalContent.replace(
              /<div class="result-total">Total Result: .*?<\/div>/,
              ''
          ).replace(
              /<button class="push-your-luck-button"[^>]*>.*?<\/button>/,
              luckRollContent
          );

          originalMessage.update({ content: updatedContent }).then(() => {
              console.log("Original message updated");
          }).catch(error => {
              console.error("Error updating original message:", error);
          });
      });
  }).catch(error => {
      console.error("Fehler beim Würfeln:", error);
  });
}

  _onShowBonusDialog(attr, event) {
    event.preventDefault();
    const actorData = this.actor.system;
  
    // Zugriff auf die Formpunkte innerhalb des core-Objekts
    const formPointsMax = actorData.core.formpoints.value;
  
    new Dialog({
      title: `Add Bonus Dice and Form Points to ${attr.toUpperCase()}`,
      content: `
        <form>
          <div class="form-group">
            <label>Form Points (max ${formPointsMax}):</label>
            <div class="form-points-input">
              <button type="button" class="decrease-form-points">-</button>
              <input type="number" name="form-points" min="0" value="0" max="${formPointsMax}">
              <button type="button" class="increase-form-points">+</button>
            </div>
          </div>
          <div class="form-group">
            <label>Bonus Dice:</label>
            <div class="bonus-dice-input">
              <button type="button" class="decrease-bonus-dice">-</button>
              <input type="number" name="bonus-dice" min="0" value="0">
              <button type="button" class="increase-bonus-dice">+</button>
            </div>
          </div>
        </form>
      `,
      buttons: {
        roll: {
          label: "Roll",
          callback: (html) => {
            const bonusDice = parseInt(html.find('[name="bonus-dice"]').val(), 10);
            const formPoints = parseInt(html.find('[name="form-points"]').val(), 10);
            this._rollAttribute(attr, actorData.attributes[attr].value, bonusDice, formPoints);
            if (formPoints > 0) {
              const newFormPointsValue = formPointsMax - formPoints;
              this.actor.update({ 'system.core.formpoints.value': newFormPointsValue });
            }
          }
        }
      },
      default: "roll",
      render: (html) => {
        const formPointsInput = html.find('[name="form-points"]');
        const bonusDiceInput = html.find('[name="bonus-dice"]');
  
        html.find('.decrease-form-points').click((event) => {
          let value = parseInt(formPointsInput.val(), 10);
          if (value > 0) formPointsInput.val(--value);
        });
        html.find('.increase-form-points').click((event) => {
          let value = parseInt(formPointsInput.val(), 10);
          if (value < formPointsMax) formPointsInput.val(++value);
        });
        html.find('.decrease-bonus-dice').click((event) => {
          let value = parseInt(bonusDiceInput.val(), 10);
          if (value > 0) bonusDiceInput.val(--value);
        });
        html.find('.increase-bonus-dice').click((event) => {
          let value = parseInt(bonusDiceInput.val(), 10);
          bonusDiceInput.val(++value);
        });
      }
    }).render(true);
  }

  _onShowWeaponBonusDialog(itemId, event) {
    event.preventDefault();
    const item = this.actor.items.get(itemId);
    const weaponType = item.system.weaponType;
    const weaponName = item.name;
    const actorData = this.actor.system;
  
    // Zugriff auf die Formpunkte innerhalb des core-Objekts
    const formPointsMax = actorData.core.formpoints.value;
  
    new Dialog({
      title: `Add Bonus Dice and Form Points to ${weaponName}`,
      content: `
        <form>
          <div class="form-group">
            <label>Form Points (max ${formPointsMax}):</label>
            <div class="form-points-input">
              <button type="button" class="decrease-form-points">-</button>
              <input type="number" name="form-points" min="0" value="0" max="${formPointsMax}">
              <button type="button" class="increase-form-points">+</button>
            </div>
          </div>
          <div class="form-group">
            <label>Bonus Dice:</label>
            <div class="bonus-dice-input">
              <button type="button" class="decrease-bonus-dice">-</button>
              <input type="number" name="bonus-dice" min="0" value="0">
              <button type="button" class="increase-bonus-dice">+</button>
            </div>
          </div>
        </form>
      `,
      buttons: {
        roll: {
          label: "Roll",
          callback: (html) => {
            const bonusDice = parseInt(html.find('[name="bonus-dice"]').val(), 10) || 0;
            const formPoints = parseInt(html.find('[name="form-points"]').val(), 10) || 0;
            this._rollWeaponWithBonus(itemId, bonusDice, formPoints);
            if (formPoints > 0) {
              const newFormPointsValue = formPointsMax - formPoints;
              this.actor.update({ 'system.core.formpoints.value': newFormPointsValue });
            }
          }
        }
      },
      default: "roll",
      render: (html) => {
        const formPointsInput = html.find('[name="form-points"]');
        const bonusDiceInput = html.find('[name="bonus-dice"]');
  
        html.find('.decrease-form-points').click((event) => {
          let value = parseInt(formPointsInput.val(), 10) || 0;
          if (value > 0) formPointsInput.val(--value);
        });
        html.find('.increase-form-points').click((event) => {
          let value = parseInt(formPointsInput.val(), 10) || 0;
          if (value < formPointsMax) formPointsInput.val(++value);
        });
        html.find('.decrease-bonus-dice').click((event) => {
          let value = parseInt(bonusDiceInput.val(), 10) || 0;
          if (value > 0) bonusDiceInput.val(--value);
        });
        html.find('.increase-bonus-dice').click((event) => {
          let value = parseInt(bonusDiceInput.val(), 10) || 0;
          bonusDiceInput.val(++value);
        });
      }
    }).render(true);
  }
  
  _rollWeaponWithBonus(itemId, bonusDice, formPoints) {
    const item = this.actor.items.get(itemId);
    const weaponType = item.system.weaponType;
    const weaponLevel = parseInt(item.system.weaponLevel) || 0;
  
    // Suche nach dem passenden Weaponskill
    const weaponSkills = [this.actor.system.weaponskills1, this.actor.system.weaponskills2];
    const matchingSkill = weaponSkills.find(skill => skill.type.toLowerCase() === weaponType.toLowerCase());
  
    if (!matchingSkill) {
      ui.notifications.warn(`No matching Weaponskill found for weapon type: ${weaponType}`);
      return;
    }
  
    // Berechne die Anzahl der Bonuswürfel basierend auf dem Level
    let skillLevel;
    switch (matchingSkill.level) {
      case 'trained': skillLevel = 4; break;
      case 'expert': skillLevel = 6; break;
      case 'master': skillLevel = 8; break;
      case 'legendary': skillLevel = 10; break;
      case 'untrained':
      default:
        skillLevel = 2; break;
    }
  
    const characterLevel = this.actor.system.core.level.value || 0;
  
    let levelBonusDice = 0;
    if (characterLevel >= 1 && characterLevel <= 3) {
      levelBonusDice = 1;
    } else if (characterLevel >= 4 && characterLevel <= 6) {
      levelBonusDice = 2;
    } else if (characterLevel >= 7 && characterLevel <= 9) {
      levelBonusDice = 3;
    } else if (characterLevel >= 10 && characterLevel <= 12) {
      levelBonusDice = 4;
    } else if (characterLevel >= 13 && characterLevel <= 15) {
      levelBonusDice = 5;
    }
  
    const strength = this.actor.system.attributes.str.value || 0;
    const agility = this.actor.system.attributes.agi.value || 0;
    const statBonusDice = Math.floor(Math.max(strength, agility) / 2);
  
    const totalDice = Number(skillLevel) + Number(levelBonusDice) + Number(statBonusDice) + Number(weaponLevel) + Number(bonusDice) + Number(formPoints);
  
    // Erstelle und führe den Wurf aus
    const rollFormula = `${totalDice}d6cs>=4df=1x=6cs>=4df=1`;
    const roll = new Roll(rollFormula);
  
    roll.evaluate({ async: true }).then(result => {
      console.log("Roll formula:", roll.formula);
      console.log("Roll results:", roll);
  
      // Generating a unique ID for the roll
      const rollId = randomID();
  
      const critSuccessImg = 'systems/cause/assets/crit_success.png';
      const successImg = 'systems/cause/assets/success.png';
      const failureImg = 'systems/cause/assets/failure.png';
  
      let critSuccesses = 0;
      let successes = 0;
      let failures = 0;
  
      if (roll.dice && roll.dice[0] && roll.dice[0].results) {
        roll.dice[0].results.forEach(result => {
          if (result.result === 6) {
            critSuccesses++;
          } else if (result.result >= 4) {
            successes++;
          } else if (result.result === 1) {
            failures++;
          }
        });
      } else {
        console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
      }
  
      const critSuccessImages = critSuccesses > 0 ? 
        Array(critSuccesses).fill(`<img src="${critSuccessImg}" alt="Critical Success" class="result-img">`).join('') : 
        `<div class="none-text">None</div>`;
  
      const successImages = successes > 0 ? 
        Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
        `<div class="none-text">None</div>`;
  
      const failureImages = failures > 0 ? 
        Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
        `<div class="none-text">None</div>`;
  
      const messageContent = `
        <div class="chat-message">
          <div class="message-content">
            <div class="attribute-name">${item.name} (${weaponType})</div>
            <div class="footer-line"></div>
            <div class="results-line">${critSuccessImages}</div>
            <div class="separator-line"></div>
            <div class="results-line">${successImages}</div>
            <div class="separator-line"></div>
            <div class="results-line">${failureImages}</div>
            <div class="footer-line"></div>
            <div class="result-total">Total Result: ${roll.total}</div>
            <button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
          </div>
        </div>
      `;
      console.log("Chat message created with rollId:", rollId);
  
      // Integration with Dice So Nice
      game.dice3d?.showForRoll(roll, game.user, true).then(() => {
        ChatMessage.create({
          user: game.user._id,
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: messageContent,
          roll: roll,
          flags: { rollId: rollId }
        });
      });
    }).catch(error => {
      console.error("Fehler beim Würfeln:", error);
    });
  }

  _onRollFormpoints(event) {
    event.preventDefault();

    // Überprüfen, ob die Shift-Taste gedrückt wurde
    if (!event.shiftKey) {
      return; // Funktion nicht ausführen, wenn Shift nicht gedrückt ist
    }

    // Würfeln eines d8
    const roll = new Roll('1d8');
    roll.roll().then(result => {
      const rolledValue = result.total;

      // Formpunkte aktualisieren
      const currentFormpoints = this.actor.system.core.formpoints.value;
      const newFormpoints = rolledValue;

      this.actor.update({ 'system.core.formpoints.value': newFormpoints });

      // Ausgabe der Nachricht im Chat
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Rolling for Formpoints.`,
      });
    });
  }


  _onAddSkill(event) {
    event.preventDefault();
    // Konvertiere das skills Objekt in ein Array
    const skillsObj = this.actor.system.skills || {};
    const skills = Object.values(skillsObj);

    // Füge den neuen Skill hinzu
    skills.push({ skillname: 'New Skill', skilllevel: 'untrained', stat: 'strength', description: '', isFirearm: false, forFirearm: 'pistol' });

    // Konvertiere das Array zurück in ein Objekt mit numerischen Schlüsseln
    const newSkillsObj = {};
    skills.forEach((skill, index) => {
        newSkillsObj[index] = skill;
    });

    // Aktualisiere den Actor
    this.actor.update({ 'system.skills': newSkillsObj });
}

_onRollSkill(event) {
  event.preventDefault();
  const skillIndex = event.currentTarget.closest('.skill').dataset.index;
  const skill = this.actor.system.skills[skillIndex];

  let numDice;
  switch (skill.skilllevel) {
      case 'trained': numDice = 4; break;
      case 'expert': numDice = 6; break;
      case 'master': numDice = 8; break;
      case 'legendary': numDice = 10; break;
      case 'untrained':
      default:
          numDice = 2; break;
  }

  // Hier wird der Attributwert hinzugefügt
  const attributeMap = {
      strength: "str",
      agility: "agi",
      wits: "wit",
      brains: "bra"
  };

  const statKey = attributeMap[skill.stat] || skill.stat;
  const attributeValue = this.actor.system.attributes[statKey]?.value || 0;
  const totalDice = numDice + Number(attributeValue);

  const rollFormula = `${totalDice}d6cs>=4df1x6cs>=4df1`;
  const roll = new Roll(rollFormula);

  roll.roll({async: true}).then(result => {
      console.log("Roll formula:", roll.formula);
      console.log("Roll results:", roll);
      
      // Generating a unique ID for the roll
      const rollId = randomID();

      const critSuccessImg = 'systems/cause/assets/crit_success.png';
      const successImg = 'systems/cause/assets/success.png';
      const failureImg = 'systems/cause/assets/failure.png';

      let critSuccesses = 0;
      let successes = 0;
      let failures = 0;

      if (roll.dice && roll.dice[0] && roll.dice[0].results) {
          roll.dice[0].results.forEach(result => {
              if (result.result === 6) {
                  critSuccesses++;
              } else if (result.result >= 4) {
                  successes++;
              } else if (result.result === 1) {
                  failures++;
              }
          });
      } else {
          console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
      }

      const critSuccessImages = critSuccesses > 0 ? 
          Array(critSuccesses).fill(`<img src="${critSuccessImg}" alt="Critical Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const successImages = successes > 0 ? 
          Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const failureImages = failures > 0 ? 
          Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const totalResult = roll.total || 0;

      const messageContent = `
          <div class="chat-message">
              <div class="message-content">
                  <div class="attribute-name">${skill.skillname}</div>
                  <div class="footer-line"></div>
                  <div class="results-line">${critSuccessImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${successImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${failureImages}</div>
                  <div class="footer-line"></div>
                  <div class="result-total">Total Result: ${totalResult}</div>
                  <button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${totalResult}">Push your Luck?</button>
              </div>
          </div>
      `;
      console.log("Chat message created with rollId:", rollId);

      game.dice3d?.showForRoll(roll, game.user, true).then(() => {
          ChatMessage.create({
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: messageContent,
              roll: roll,
              flags: { rollId: rollId }
          });
      });
  }).catch(error => {
      console.error("Fehler beim Würfeln:", error);
  });
}

_onEditSkill(event) {
  event.preventDefault();
  const index = event.currentTarget.closest('.skill').dataset.index;
  const skill = this.actor.system.skills[index];

  new Dialog({
      title: "Edit Skill",
      content: `
          <form>
              <div class="form-group">
                  <label>Skill Name</label>
                  <input type="text" id="edit-skill-name" value="${skill.skillname}">
              </div>
              <div class="form-group">
                  <label>Description</label>
                  <textarea id="edit-skill-description">${skill.description}</textarea>
              </div>
              <div class="form-group">
                  <label>Skill Level</label>
                  <select id="edit-skill-level">
                      <option value="untrained" ${skill.skilllevel === "untrained" ? "selected" : ""}>Untrained</option>
                      <option value="trained" ${skill.skilllevel === "trained" ? "selected" : ""}>Trained</option>
                      <option value="expert" ${skill.skilllevel === "expert" ? "selected" : ""}>Expert</option>
                      <option value="master" ${skill.skilllevel === "master" ? "selected" : ""}>Master</option>
                      <option value="legendary" ${skill.skilllevel === "legendary" ? "selected" : ""}>Legendary</option>
                  </select>
              </div>
              <div class="form-group">
                  <label>Stat</label>
                  <select id="edit-skill-stat">
                      <option value="strength" ${skill.stat === "strength" ? "selected" : ""}>Strength</option>
                      <option value="agility" ${skill.stat === "agility" ? "selected" : ""}>Agility</option>
                      <option value="wits" ${skill.stat === "wits" ? "selected" : ""}>Wits</option>
                      <option value="brains" ${skill.stat === "brains" ? "selected" : ""}>Brains</option>
                  </select>
              </div>
          </form>
      `,
      buttons: {
          save: {
              icon: '<i class="fas fa-check"></i>',
              label: "Save",
              callback: html => this._onSaveSkill(html, index)
          }
      },
      default: "save"
  }).render(true);
}

_onDeleteSkill(event) {
  event.preventDefault();
  const index = event.currentTarget.closest('.skill').dataset.index;

  // Konvertiere das skills Objekt in ein Array
  const skillsObj = this.actor.system.skills || [];
  const skills = Array.isArray(skillsObj) ? skillsObj : Object.values(skillsObj);

  // Entferne den Skill
  skills.splice(index, 1);

  // Aktualisiere den Actor
  this.actor.update({ 'system.skills': skills }).then(() => {
    this.render();  // Rendere das Sheet neu, um die Änderungen anzuzeigen
  });
}

_onSaveSkill(html, index) {
  const skills = this.actor.system.skills;

  // Update skill with new values
  skills[index].skillname = html.find('#edit-skill-name').val();
  skills[index].description = html.find('#edit-skill-description').val();
  skills[index].skilllevel = html.find('#edit-skill-level').val();
  skills[index].stat = html.find('#edit-skill-stat').val();

  this.actor.update({ 'system.skills': skills });
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

  // Erstelle den Container für die Waffenfertigkeiten
  const container = document.createElement('div');
  container.className = 'weaponskill-options';

  // Füge die Waffenfertigkeiten hinzu
  weaponskillsData.forEach((skill) => {
    const skillDiv = document.createElement('div');
    skillDiv.className = 'weaponskill-option';
    const skillImage = skill.image || 'systems/cause/assets/systems/cause/assets/blank-black.png'; // Standardbild, wenn kein Bild vorhanden
    skillDiv.style.backgroundImage = `url('${skillImage}')`;
    const skillSpan = document.createElement('span');
    skillSpan.textContent = skill.type;
    skillDiv.appendChild(skillSpan);
    skillDiv.dataset.skill = skill.type;
    skillDiv.dataset.image = skillImage; // Füge das Bild als Dataset hinzu
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
  }, { classes: ["weaponskill-dialog"], width: 550 }).render(true); // Setze die Klasse und die Breite hier
}

_selectWeaponSkill(skill, skillSlot) {
  console.log(`_selectWeaponSkill called with skill: ${skill.type}, slot: ${skillSlot}`);
  const skillImage = skill.image || 'systems/cause/assets/blank-black.png'; // Standardbild, wenn kein Bild vorhanden
  const updateData = {};
  updateData[`system.${skillSlot}`] = {
    type: skill.type,
    level: "untrained",
    img: skillImage // Füge das Bild zum Update-Daten hinzu
  };
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
  updateData[`system.${skillSlot}`] = { type: "", level: 0, img: 'systems/cause/assets/blank-black.png' }; // Standardbild setzen
  this.actor.update(updateData);
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
  updateData[`system.${skillSlot}`] = { 
    type: "", 
    level: 0,
    img: 'systems/cause/assets/blank-black.png' // Standardbildpfad setzen
  };
  this.actor.update(updateData).then(() => {
    console.log("Deleted core skill for slot:", skillSlot); // Konsolenausgabe zur Überprüfung
  }).catch(error => {
    console.error("Error deleting core skill:", error);
  });
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
  console.log("Skill Slot:", skillSlot);  // Konsolenausgabe zur Überprüfung

  const coreskillsData = CONFIG.CORESKILLS;

  // Mapping der Coreskills zu ihren jeweiligen Attributen
  const mappedSkills = {
    str: coreskillsData.filter(skill => skill.stat === 'str'),
    agi: coreskillsData.filter(skill => skill.stat === 'agi'),
    wit: coreskillsData.filter(skill => skill.stat === 'wit'),
    bra: coreskillsData.filter(skill => skill.stat === 'bra')
  };

  // Erstelle den Container mit den Spalten und den entsprechenden Überschriften
  const container = document.createElement('div');
  container.className = 'coreskill-options';

  const columns = {
    str: document.createElement('div'),
    agi: document.createElement('div'),
    wit: document.createElement('div'),
    bra: document.createElement('div')
  };

  // Setze die Überschriften für die Spalten
  columns.str.innerHTML = '<h3>Strength</h3>';
  columns.agi.innerHTML = '<h3>Agility</h3>';
  columns.wit.innerHTML = '<h3>Wits</h3>';
  columns.bra.innerHTML = '<h3>Brains</h3>';

  // Füge die Skills zu den entsprechenden Spalten hinzu
  for (let [key, value] of Object.entries(mappedSkills)) {
    value.forEach((skill) => {
      const skillDiv = document.createElement('div');
      skillDiv.className = 'coreskill-option';
      if (skill.image) {
        skillDiv.style.backgroundImage = `url('${skill.image}')`;
      }
      const skillSpan = document.createElement('span');
      skillSpan.textContent = skill.type;
      skillDiv.appendChild(skillSpan);
      skillDiv.dataset.skill = skill.type;
      skillDiv.dataset.img = skill.image || ''; // Bildpfad als Datenattribut hinzufügen
      columns[key].appendChild(skillDiv);
    });
  }

  // Füge die Spalten zum Container hinzu
  const columnWrapper = document.createElement('div');
  columnWrapper.className = 'column-wrapper';
  for (let column of Object.values(columns)) {
    columnWrapper.appendChild(column);
  }
  container.appendChild(columnWrapper);

  const content = container.outerHTML;
  console.log("Generated Dialog Content:", content);  // Konsolenausgabe zur Überprüfung

  const dialog = new Dialog({
    title: "Choose a Coreskill",
    content: content,
    buttons: {},
    default: "ok",
    render: (html) => {
      html.find('.coreskill-option').click((event) => {
        const selectedSkillType = event.currentTarget.dataset.skill;
        const selectedSkill = coreskillsData.find(skill => skill.type === selectedSkillType);
        const selectedSkillImg = event.currentTarget.dataset.img || 'systems/cause/assets/blank-black.png'; // Bildpfad abrufen oder Standardbild verwenden
        console.log(`Selected ${selectedSkillType} for ${skillSlot}, Image: ${selectedSkillImg}`);  // Konsolenausgabe zur Überprüfung
        this._selectCoreSkill(selectedSkill, skillSlot, selectedSkillImg);
        dialog.close();
      });
    }
  }, { classes: ["wider-dialog"], width: 1125 }).render(true); // Setze die Klasse und die Breite hier
}

_selectCoreSkill(selectedSkill, skillSlot, imgPath) {
  const updateData = {};
  updateData[`system.${skillSlot}`] = {
    type: selectedSkill.type,
    level: 'untrained',  // Standardlevel setzen
    stat: selectedSkill.stat, // Der Stat aus der Config
    img: imgPath // Bildpfad aus dem Dialog oder Standardbild
  };
  this.actor.update(updateData).then(() => {
    console.log("Updated actor data with new core skill:", updateData);  // Konsolenausgabe zur Überprüfung
  }).catch(error => {
    console.error("Error updating actor data:", error);
  });
}

_rollCoreSkill(event) {
  event.preventDefault();
  const skillSlot = event.currentTarget.closest('.coreskill-box').dataset.skill;
  const skill = this.actor.system[skillSlot];

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

  const attributeValue = this.actor.system.attributes[skill.stat]?.value || 0;
  const totalDice = numDice + Number(attributeValue);

  const rollFormula = `${totalDice}d6cs>=4df1x6cs>=4df1`;
  const roll = new Roll(rollFormula);

  roll.roll({async: true}).then(result => {
      console.log("Roll formula:", roll.formula);
      console.log("Roll results:", roll);
      
      // Generating a unique ID for the roll
      const rollId = randomID();

      const critSuccessImg = 'systems/cause/assets/crit_success.png';
      const successImg = 'systems/cause/assets/success.png';
      const failureImg = 'systems/cause/assets/failure.png';

      let critSuccesses = 0;
      let successes = 0;
      let failures = 0;

      if (roll.dice && roll.dice[0] && roll.dice[0].results) {
          roll.dice[0].results.forEach(result => {
              if (result.result === 6) {
                  critSuccesses++;
              } else if (result.result >= 4) {
                  successes++;
              } else if (result.result === 1) {
                  failures++;
              }
          });
      } else {
          console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
      }

      const critSuccessImages = critSuccesses > 0 ? 
          Array(critSuccesses).fill(`<img src="${critSuccessImg}" alt="Critical Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const successImages = successes > 0 ? 
          Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const failureImages = failures > 0 ? 
          Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const totalResult = roll.total || 0;

      const messageContent = `
          <div class="chat-message">
              <div class="message-content">
                  <div class="attribute-name">${skill.type}</div>
                  <div class="footer-line"></div>
                  <div class="results-line">${critSuccessImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${successImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${failureImages}</div>
                  <div class="footer-line"></div>
                  <div class="result-total">Total Result: ${totalResult}</div>
                  <button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${totalResult}">Push your Luck?</button>
              </div>
          </div>
      `;
      console.log("Chat message created with rollId:", rollId);

      game.dice3d?.showForRoll(roll, game.user, true).then(() => {
          ChatMessage.create({
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: messageContent,
              roll: roll,
              flags: { rollId: rollId }
          });
      });
  }).catch(error => {
      console.error("Fehler beim Würfeln:", error);
  });
}
}