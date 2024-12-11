// Imports
import { CauseClassActor } from "./module/documents/actor.mjs";
import { CauseClassActorSheet } from "./module/sheets/actor-sheet.mjs";

import { CauseClassItem } from "./module/documents/item.mjs";
import { CauseClassItemSheet } from "./module/sheets/item-sheet.mjs";

import { registerHelpers } from './module/helpers/handlebars.mjs'

// Import DataModels
import * as models from './module/data/_module.mjs';

Hooks.once('init', function () {

    game.cause = {
        CauseClassActor,
        CauseClassItem,
    };

    console.log('CustomSystem | Initializing Handlebars helpers...');
    registerHelpers();

    // DataModels Management
    CONFIG.Actor.documentClass = CauseClassActor;
    Object.assign(CONFIG.Actor.dataModels = {
        character: models.CauseClassCharacter
    })

    CONFIG.Item.documentClass = CauseClassItem;
    CONFIG.Item.dataModels.weapon = models.CauseClassWeapon;

    // GameSettings Management
    game.settings.register('cause', 'currentDice', {
        name: 'The currently set dice.',
        hint: '',
        scope: 'world',
        config: true,
        type: String,
        default: "d10",
        requiresReload: false,
        onChange: () => {
          console.info('Wird gemacht X');
  
          // Durch alle offenen ActorSheets iterieren
          for (let sheet of Object.values(ui.windows)) {
              if (sheet instanceof ActorSheet) {
                  const actor = sheet.actor;
                  if (actor) {
                      sheet.render(false); // Neu rendern des ActorSheets
                      console.info(`ActorSheet für ${actor.name} wird neu gerendert`);
                  }
              }
          }
      }
    })

    // Sheet Management
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('cause', CauseClassActorSheet, {
        makeDefault: true,
        label: 'CAUSE_CONSTANT.SheetLabels.Actor',
    });

    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('cause', CauseClassItemSheet, {
      makeDefault: true,
      label: 'CAUSE_CONSTANT.SheetLabels.Item',
    });

    //return preloadedHandlebarsTemplates();
});

Hooks.on("renderActorSheet", (sheet, html) => {
  // Überprüfe, ob das Game Setting geändert wurde
  const diceType = game.settings.get("cause", "currentDice");

  // Füge das entsprechende Icon mit der aktuellen Einstellung in den HTML-Code ein
  const iconElement = html.find(".cause-actor-dice-icon"); // Zielt auf das Icon-Element
  // Aktualisiere das Icon dynamisch
  iconElement.removeClass().addClass(`fa-solid fa-dice-${diceType}`);


    // Suche nach dem Button mit der Klasse "skill-tree" und entferne ihn
    const skillTreeButton = html.find('.skill-tree-header-button');
    if (skillTreeButton.length > 0) {
        skillTreeButton.remove();  // Entferne den Button
    }

});

Hooks.once('renderChatLog', (app, html, data) => {
  if (!game.user.isGM) return;

  const buttonHTML = `
    <div id="gm-buttons-container" style="margin-top: 10px; display: flex; justify-content: space-between; gap: 5px;">
      <button class="gm-button" style="flex: 1; text-align: center; padding: 5px;" data-button="d6">
        <i class="fas fa-dice-d6"></i>
      </button>
      <button class="gm-button" style="flex: 1; text-align: center; padding: 5px;" data-button="d8">
        <i class="fas fa-dice-d8"></i>
      </button>
      <button class="gm-button" style="flex: 1; text-align: center; padding: 5px;" data-button="d10">
        <i class="fas fa-dice-d10"></i>
      </button>
      <button class="gm-button" style="flex: 1; text-align: center; padding: 5px;" data-button="d12">
        <i class="fas fa-dice-d12"></i>
      </button>
      <button class="gm-button" style="flex: 1; text-align: center; padding: 5px;" data-button="d20">
        <i class="fas fa-dice-d20"></i>
      </button>
    </div>`;

  html.find('.control-buttons').after(buttonHTML);
  const selectedDie = game.settings.get('cause','currentDice');
  if (selectedDie) {
    const selectedButton = html.find(`.gm-button[data-button="${selectedDie}"]`);
    selectedButton.css('border', '2px solid red');
  }

});

Hooks.once('renderChatLog', (app, html, data) => {
  if (!game.user.isGM) return;
  function updateButtonHighlight(selectedButtonId) {
    html.find('#gm-buttons-container .gm-button').css('border', '');
    const selectedButton = html.find(`#gm-buttons-container .gm-button[data-button="${selectedButtonId}"]`);
    selectedButton.css('border', '2px solid red');
  }
  html.find('#gm-buttons-container .gm-button').click((event) => {
    const buttonId = $(event.currentTarget).data('button');
    game.settings.set('cause','currentDice', buttonId);
    updateButtonHighlight(buttonId);
  });
});

Hooks.on('getChatLogEntryContext', (html, options) => {
  console.log("Erweitere das Chat-Kontextmenü mit der Push-Option");

  options.push({
      name: "Push Roll", // Name der Option im Menü
      icon: '<i class="fas fa-redo"></i>', // Symbol vor dem Text
      condition: li => {
          // Prüfe, ob die Nachricht die Flag "isPushable" hat
          const message = game.messages.get(li.data("messageId"));
          return message?.getFlag("cause", "isPushable") === true;
      },
      callback: li => {
        const message = game.messages.get(li.data("messageId"));
        if (!message) {
            ui.notifications.error("Nachricht nicht gefunden.");
            return;
        }
    
        // Die für den Push Roll verwendeten Daten aus der Nachricht holen
        const neutralDiceCount = message.getFlag("cause", "neutralDiceCount");
        const diceType = message.getFlag("cause", "diceType");
        const successCount = message.getFlag("cause", "successCount");
        const failureCount = message.getFlag("cause", "failureCount");
        const rollFormula = `${neutralDiceCount}${diceType}`;
        console.log("Roll formula für Push Roll:", rollFormula);
    
        // Roll ausführen
        const roll = new Roll(rollFormula);
        roll.roll().then(result => {
            console.log("Push Roll Ergebnisse:", roll);
    
            const results = roll.dice[0].results.map(r => r.result); // Einzelwürfelergebnisse
    
            // Erfolgs- und Misserfolgsbedingungen
            let successThreshold, failThreshold = 1;
            switch (diceType) {
                case 'd6': successThreshold = 6; break;
                case 'd8': successThreshold = 7; break;
                case 'd10': successThreshold = 7; break;
                case 'd12': successThreshold = 7; break;
                case 'd20': successThreshold = 11; break;
                default:
                    console.error("Unbekannter Würfeltyp: " + diceType);
                    return;
            }
    
            // Zähle Erfolge und Misserfolge
            const successes = results.filter(r => r >= successThreshold).length;
            const failures = results.filter(r => r === failThreshold).length;
    
            // Holen des alten Inhalts der Nachricht, um ihn zu erweitern
            let oldContent = message.content || "";

            // Entfernen der spezifischen Zeile mit den Erfolgen und Misserfolgen aus dem alten Inhalt
            const summaryRegex = /<div class="successes"[^>]*>.*?<\/div>/s;
            oldContent = oldContent.replace(summaryRegex, "");
            // Entfernen der spezifischen Zeile mit den Erfolgen und Misserfolgen aus dem alten Inhalt
            const summaryRegex2 = /<div class="failures"[^>]*>.*?<\/div>/s;
            oldContent = oldContent.replace(summaryRegex2, "");

            // Berechnung für die Aufteilung der Ergebnisse auf zwei Zeilen, falls nötig
            const splitIndex = 8; // Ab dieser Zahl teilen wir die Ergebnisse auf
            const firstRowResults = results.slice(0, splitIndex); // Erste Zeile
            const secondRowResults = results.slice(splitIndex); // Zweite Zeile, falls es mehr als 8 Ergebnisse gibt

            // Neue Nachricht zusammenstellen, die die vorherige Nachricht erweitert
            const newContent = `
                <div class="message-content">
                    <div class="dice-roll">
                        <section style="display: flex; justify-content: center; align-items: center;">
                        </section>
                        <div class="dice-result">
                            <div class="dice-formula">${rollFormula}</div>
                            <div class="dice-tooltip" style="display: none;">
                                <section class="tooltip-part">
                                    <div class="dice">
                                        <div class="dice-rolls" style="display: flex; justify-content: center; gap: 10px;">
                                            ${firstRowResults.map(result => {
                                                let diceClass = '';
    
                                                // Erfolge grün, Misserfolge rot
                                                if (result >= successThreshold) {
                                                    diceClass = 'success';
                                                } else if (result === failThreshold) {
                                                    diceClass = 'failure';
                                                }
    
                                                return `<div class="roll die ${diceType} ${diceClass}" style="font-size: 1.5em; text-align: center;">${result}</div>`;
                                            }).join('')}
                                        </div>
                                    </div>
                                    ${secondRowResults.length > 0 ? `
                                    <div class="dice-rolls" style="display: flex; justify-content: center; gap: 10px;">
                                        ${secondRowResults.map(result => {
                                            let diceClass = '';
    
                                            // Erfolge grün, Misserfolge rot
                                            if (result >= successThreshold) {
                                                diceClass = 'success';
                                            } else if (result === failThreshold) {
                                                diceClass = 'failure';
                                            }
    
                                            return `<div class="roll die ${diceType} ${diceClass}" style="font-size: 1.5em; text-align: center;">${result}</div>`;
                                        }).join('')}
                                    </div>
                                    ` : ''}
                                </section>
                            </div>
                            <!-- Neue Anzeige für Erfolge und Misserfolge -->
                            <div class="dice-summary" style="display: flex; justify-content: space-between; margin-top: 10px;">
                                <div style="display: flex; align-items: center; gap: 5px; color: green;">
                                    <i class="fa-duotone fa-solid fa-hand-fist"></i>
                                    <span>Successes: ${successes + successCount}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 5px; color: red;">
                                    <i class="fa-sharp-duotone fa-regular fa-bolt"></i>
                                    <span>Failures: ${failures + failureCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    
            // Die alte Nachricht mit dem neuen Inhalt kombinieren
            const updatedContent = oldContent + newContent;
    
            // Aktualisierte Nachricht in den Chat einfügen
            message.update({
                content: updatedContent,
                flags: {
                    "cause": {
                        isPushable: true, // Markiert die Nachricht weiterhin als pushable
                        neutralDiceCount: neutralDiceCount, // Anzahl neutraler Würfel
                        diceType: diceType // Typ des verwendeten Würfels
                    }
                }
            });
    
            // Zeigt die Würfel-Animationen
            game.dice3d?.showForRoll(roll, game.user, true);
        }).catch(error => {
            console.error("Fehler beim Würfeln:", error);
        });
    }
  });
});

Hooks.on("ready", () => {
  // Wenn die Einstellung geändert wurde, sollen wir das UI entsprechend anpassen
  console.log("Foundry ist bereit!");
  game.socket.on("settings.updated", (data) => {
    if (data.setting === "currentDice") {
      // Holen Sie sich das aktualisierte Dice-Setting
      const diceType = data.value;
      const iconElement = document.querySelector(".cause-actor-dice-icon");
      
      if (iconElement) {
        // Entfernen Sie das alte Icon, wenn es vorhanden ist
        iconElement.classList.remove("fa-solid", "fa-dice-d10", "fa-dice-d20");

        // Fügen Sie das neue Icon basierend auf dem Dice-Setting hinzu
        iconElement.classList.add(`fa-solid`, `fa-dice-${diceType}`);
      }
    }
  });
  
});