export class CauseClassActorSheet extends ActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['cause', 'sheet', 'actor'],
            width: 425,
            height: 600,
            tabs: [{
                navSelector: '.cause-actor-navigation',
                contentSelector: '.cause-actor-content',
                initial: 'inventory',
            },],
        });
    }
    get template() {
        return `systems/cause/templates/actor-sheet.hbs`;
    } 
    getData() {
        const context = super.getData();
        const actorData = context.data;
        context.system = actorData.system;
        context.flags = actorData.flags;
    
        // Prepare inventory items categorized by type
        const items = {
            weapons: [],
            consumables: [],
            others: []
        };

        for (const i of context.items) {
            switch (i.type) {
                case "weapon":
                    items.weapons.push(i);
                    break;
                case "consumable":
                    items.consumables.push(i);
                    break;
                default:
                    items.others.push(i);
                    break;
            }
        }

        // Assign categorized items to the template data
        context.inventory = items;

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.on('click', '.cause-attribute', this._onAttributeRoll.bind(this));
        html.on('click', '.cause-actor-madness-icons', this._onLeftClickPendulum.bind(this));
        html.on('contextmenu', '.cause-actor-madness-icons', this._onRightClickPendulum.bind(this));

        html.find(".item-name").click(ev => {
            const details = $(ev.currentTarget).siblings(".item-details");
            details.slideToggle();
        });

        html.find(".item-delete .fa-trash").click(async ev => {
            const itemId = ev.currentTarget.dataset.itemId;
            const confirmed = await Dialog.confirm({
                title: "Delete Item",
                content: "<p>Are you sure you want to delete this item?</p>",
                defaultYes: false
            });
            if (confirmed) {
                await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
            }
        });
    }

    _onAttributeRoll(event) {
        event.preventDefault();
    
        // Attribut und Akteur auslesen
        const attribute = event.currentTarget.dataset.att;
        const actor = this.actor.system;
    
        // Würfeltyp aus den Einstellungen holen
        const currentDice = game.settings.get("cause", "currentDice") || "d10";
    
        // Anzahl der Würfel ermitteln
        let diceCount = 0;
        let attributeName = '';
        switch (attribute) {
            case 'vigor': diceCount = actor.vigor.value; break;
            case 'grace': diceCount = actor.grace.value; break;
            case 'instinct': diceCount = actor.instinct.value; break;
            case 'thought': diceCount = actor.thought.value; break;
            default:
                console.error("Unbekanntes Attribut: " + attribute);
                return;
        }
        switch (attribute) {
            case 'vigor': attributeName = 'Vigor'; break;
            case 'grace': attributeName = 'Grace'; break;
            case 'instinct': attributeName = 'Instinct'; break;
            case 'thought': attributeName = 'Thought'; break;
            default:
                console.error("Unbekanntes Attribut: " + attribute);
                return;
        }
    
        // Roll-Formel erstellen, je nach Würfeltyp
        let rollFormula = `${diceCount}${currentDice}`;
        console.log("Roll formula:", rollFormula);  // Debugging-Hilfe, um zu sehen, welche Formel verwendet wird
    
        // Roll ausführen und auswerten
        const roll = new Roll(rollFormula);
    
        // Asynchrone Auswertung des Wurfs
        roll.roll().then(result => {
            console.log("Roll results:", roll);  // Zeigt die Ergebnisse an
    
            const results = roll.dice[0].results.map(r => r.result); // Einzelwürfel-Ergebnisse
    
            // Erfolgs- und Misserfolgsbedingungen
            let successThreshold, failThreshold = 1;
            switch (currentDice) {
                case 'd6': successThreshold = 6; break;
                case 'd8': successThreshold = 7; break;
                case 'd10': successThreshold = 7; break;
                case 'd12': successThreshold = 7; break;
                case 'd20': successThreshold = 11; break;
                default:
                    console.error("Unbekannter Würfeltyp: " + currentDice);
                    return;
            }
    
            // Ergebnisse analysieren
            const successes = results.filter(r => r >= successThreshold).length;
            const failures = results.filter(r => r === failThreshold).length;
            const neutralDice = results.filter(r => r < successThreshold && r > failThreshold);
            console.info(successes);
            console.info(failures);
    
            // Splitten der Ergebnisse in zwei Zeilen, falls mehr als 8 Würfel geworfen werden
            let resultsHTML = '';
            if (diceCount >= 8) {
                const firstRow = results.slice(0, Math.ceil(results.length / 2));
                const secondRow = results.slice(Math.ceil(results.length / 2));
    
                resultsHTML = `
                    <div class="dice-rolls" style="display: flex; justify-content: center; gap: 10px;">
                        ${firstRow.map(result => {
                            let diceClass = '';
                            if (result >= successThreshold) {
                                diceClass = 'success';
                            } else if (result === failThreshold) {
                                diceClass = 'failure';
                            }
                            return `<div class="roll die ${currentDice} ${diceClass}" style="font-size: 1.5em; text-align: center;">${result}</div>`;
                        }).join('')}
                    </div>
                    <div class="dice-rolls" style="display: flex; justify-content: center; gap: 10px;">
                        ${secondRow.map(result => {
                            let diceClass = '';
                            if (result >= successThreshold) {
                                diceClass = 'success';
                            } else if (result === failThreshold) {
                                diceClass = 'failure';
                            }
                            return `<div class="roll die ${currentDice} ${diceClass}" style="font-size: 1.5em; text-align: center;">${result}</div>`;
                        }).join('')}
                    </div>
                `;
            } else {
                resultsHTML = `
                    <div class="dice-rolls" style="display: flex; justify-content: center; gap: 10px;">
                        ${results.map(result => {
                            let diceClass = '';
                            if (result >= successThreshold) {
                                diceClass = 'success';
                            } else if (result === failThreshold) {
                                diceClass = 'failure';
                            }
                            return `<div class="roll die ${currentDice} ${diceClass}" style="font-size: 1.5em; text-align: center;">${result}</div>`;
                        }).join('')}
                    </div>
                `;
            }
    
            // Erstellte Chat-Nachricht
            const messageContent = `
                <div class="message-content">
                    <div class="dice-roll">
                        <section style="display: flex; justify-content: center; align-items: center;">
                            <label style="font-size: 20px; font-family: docGlitch; text-align: center;">
                                ${attributeName}
                            </label>
                        </section>
                        <div class="dice-result pushable-roll">
                            <div class="dice-formula">${rollFormula}</div>
                            <div class="dice-tooltip" style="display: none;">
                                <section class="tooltip-part">
                                    <div class="dice">
                                        ${resultsHTML}
                                    </div>
                                </section>
                            </div>
                            <!-- Anzeige von Erfolgen und Misserfolgen in zwei Spalten -->
                            <div class="dice-summary" style="display: flex; justify-content: space-between; margin-top: 10px;">
                                <div class="successes" style="display: flex; align-items: center; gap: 5px; color: green;">
                                    <i class="fa-duotone fa-solid fa-hand-fist"></i>
                                    <span>Successes: ${successes}</span>
                                </div>
                                <div class="failures" style="display: flex; align-items: center; gap: 5px; color: red;">
                                    <i class="fa-sharp-duotone fa-regular fa-bolt"></i>
                                    <span>Failures: ${failures}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    
            // Zeigt die Würfel-Animationen
            game.dice3d?.showForRoll(roll, game.user, true).then(() => {
                ChatMessage.create({
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor.name }),
                    content: messageContent,
                    roll: roll,
                    flags: {
                        "cause": {
                            isPushable: true, // Markiert die Nachricht als pushable
                            neutralDiceCount: neutralDice.length, // Anzahl neutraler Würfel
                            diceType: currentDice, // Typ des verwendeten Würfels
                            successCount: successes,
                            failureCount: failures
                        }
                    }
                });
            });
    
        }).catch(error => {
            console.error("Fehler beim Würfeln:", error);
        });
    }

    _onLeftClickPendulum(event) {
        event.preventDefault();
        const actor = this.actor.system;
        let currentValue = actor.pendulum.value;
        if (currentValue < 5) {
            this.actor.update({"system.pendulum.value": (actor.pendulum.value + 1)});
        }
    }
    _onRightClickPendulum(event) {
        event.preventDefault();
        const actor = this.actor.system;
        let currentValue = actor.pendulum.value;
        if (currentValue > -5) {
            this.actor.update({"system.pendulum.value": (actor.pendulum.value - 1)});
        }
    }
}



