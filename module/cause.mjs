//import CauseActor from './documents/actor.mjs'; //Import the main Actor ES module
import CauseActorSheet from './sheets/actor-sheet.mjs'; //Import the main Actor-Sheet ES module
//import CauseItem from './documents/item.mjs'; //Import the main Item ES module
import CauseItemSheet from "./sheets/item-sheet.mjs"; //Import the main Item-Sheet ES module
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs"; //Import helper document for handlebars
//import CAUSE from "./helpers/config.mjs";
import { WEAPONSKILLS } from './helpers/weaponskills.mjs';
import { CORESKILLS } from './helpers/coreskills.mjs';

Hooks.once("init", function () {
    console.log("Cause TTFS | Initialising Cause Tabletop Framework System"); //Initialisation message in console

    game.cause = { //register our main handling classes into the global game object to make it accessible for console debugging etc.
      //CauseActor,
      //CauseItem,
    };

    Handlebars.registerHelper('even', function (index) {
      return index % 2 === 0;
    });
  
    Handlebars.registerHelper('odd', function (index) {
      return index % 2 !== 0;
    });

    Handlebars.registerHelper('range', function(from, to) {
      let result = [];
      for (let i = from; i <= to; i++) {
          result.push(i);
      }
      return result;
  });

    Handlebars.registerHelper('concat', function () {
      var outStr = '';
      for (var arg in arguments) {
          if (typeof arguments[arg] !== 'object') {
              outStr += arguments[arg];
          }
      }
      return outStr;
  });

    //CONFIG.CAUSE = CAUSE; //creating a custom constant for our Config
    CONFIG.WEAPONSKILLS = WEAPONSKILLS;
    CONFIG.CORESKILLS = CORESKILLS;
    //override the base documents classes with our own
    //CONFIG.Actor.documentClass = CauseActor;
    //CONFIG.Item.documentClass = CauseItem;

    Actors.unregisterSheet("core", ActorSheet); //unregister the standard actor-sheet to make it unaccessible for users
    Actors.registerSheet("cause", CauseActorSheet, {  //register our Character sheets for:
        types: ["character"],                           //Character-type Actors
        makeDefault: true                                 //set default for new actors
      });

    Items.unregisterSheet("core", ItemSheet); //unregister the standard item-sheet to make it unaccessible for users
    Items. registerSheet("cause", CauseItemSheet, { makeDefault: true }); //registering the custom item-sheet
    //
    return preloadHandlebarsTemplates(); //preload our handlebars helper to be more easily accessible
})

Hooks.once("ready", function() {
  //testHandlebarsRendering();
});