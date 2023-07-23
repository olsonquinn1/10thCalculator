var atkModifierData;
var defModifierData;
var selectedUnit;
var selectedProfile;
var unitData;
var tableData;

var outputOptions = {
    "dmglabel": true,
    "dmg": true,
    "models": true,
    "breakdown": true,
    "simulated": false
}

function clearOutput() {
    var outputField = document.getElementById("output");
    outputField.textContent = "";
}
function testModifier(listType, testMod) {
    var modifierList = document.getElementById('list-' + listType);
    var listItems = modifierList.getElementsByTagName("li");
    var modifiers = Array.from(listItems).map(
        mod => JSON.parse(mod.dataset.value)
    );
    var modifierTypes = modifiers.map(
        mod => mod.type
    );
    var modifierNames = modifiers.map(
        mod => mod.name
    );
    if(modifierNames.includes(testMod.name)) return 1;
    if(testMod.type == 'modifier' || testMod.type == 'tag') return 0;
    if(modifierTypes.includes(testMod.type)) return 2;
    return 0;
}
function clearModifiers(type) {
    var list = document.getElementById('list-modifier-' + type);
    list.innerHTML = "";
}
function generateEmptyTable() {
    var table = document.getElementById("output-table");
    var columns = 9;
    var rows = 8;
    var inner = "<tr><th></th>";
    for(var i = 1; i <= columns; i++) {
        inner += "<th class='column-name'>Defender " + i + "</th>"
    }
    inner += "</tr>";
    
    for(var i = 1; i < rows; i++) {
        inner += "<tr><th class='row-name'>Attacker " + i + "</th>"
        for(var j = 1; j <= columns; j++) {
            inner += "<td></td>";
        }
        inner += "</tr>"
    }


    table.innerHTML = inner;
}
function getAttacker() {
    var obj = {}

    obj.mods = getModifiers("attacker")

    var nameField = document.getElementById("header-attacker-profile");
    obj.name = nameField.textContent

    obj.count = parseInt(document.getElementById("count").value);
    obj.bs = parseInt(document.getElementById("skill").value)
    obj.str = parseInt(document.getElementById("strength").value)
    obj.ap = parseInt(document.getElementById("ap").value)
    
    //attacks
    obj.atk = {}
    var atk_vals = document.getElementById("attacks").dataset.values;
    atk_vals = JSON.parse(atk_vals);
    atk_vals.forEach(i => parseInt(i));
    obj.atk.diceSides = atk_vals[1];
    obj.atk.diceMulti = atk_vals[0];
    obj.atk.value = atk_vals[2];
    obj.atk.avg = atk_vals[3];
    obj.atk.isVariable = atk_vals[1] == 0 ? true : false;
    
    //damage
    obj.dmg = {}
    var dmg_vals = document.getElementById("damage").dataset.values;
    dmg_vals = JSON.parse(dmg_vals);
    dmg_vals.forEach(i => parseInt(i));
    obj.dmg.diceSides = dmg_vals[0];
    obj.dmg.diceMulti = dmg_vals[1];
    obj.dmg.value  = dmg_vals[2];
    obj.dmg.avg = dmg_vals[3];
    obj.dmg.isVariable = dmg_vals[1] == 0 ? true : false;

    return obj
}
function getDefender() {
    var obj = {}

    obj.mods = getModifiers("defender")

    //target stats
    var nameField = document.getElementById("header-defender-name");
    obj.name = nameField.textContent
    obj.tgh = parseInt(document.getElementById("toughness").value);
    obj.wd = parseInt(document.getElementById("wounds").value);
    obj.sv = parseInt(document.getElementById("save").value);
    obj.models = parseInt(document.getElementById("models").value);
    obj.inv = parseInt(document.getElementById("invuln").value);
    obj.fnp = parseInt(document.getElementById("feel-no-pain").value);
    obj.mortalFnp = obj.fnp;

    return obj
}
function addAttackerToTable() {

    var profile = getAttacker()

    var attackerList = document.getElementById('list-test-atk');
    var listItem = document.createElement('li');
    listItem.className = "modListItem"

    var textSpan = document.createElement('span');
    var tagElement = document.getElementById('atk-group-input')
    var tagName = tagElement.value;
    if(tagName == "") tagName = profile.name
    textSpan.textContent = tagName;
    profile.tag = tagName
    listItem.appendChild(textSpan);

    var button = document.createElement("button");
    button.textContent = "Remove";
    button.onclick = function() {removeListItem(button)};
    listItem.appendChild(button);

    listItem.setAttribute("data-value", JSON.stringify(profile))

    attackerList.appendChild(listItem);
}
function addDefenderToTable() {
    var profile = getDefender()

    var defenderList = document.getElementById('list-test-def');
    var listItem = document.createElement('li');
    listItem.className = "modListItem"

    var textSpan = document.createElement('span');
    var tagElement = document.getElementById('def-group-input')
    var tagName = tagElement.value;
    if(tagName == "") tagName = profile.name
    textSpan.textContent = tagName;
    profile.tag = tagName
    listItem.appendChild(textSpan);

    var button = document.createElement("button");
    button.textContent = "Remove";
    button.onclick = function() {removeListItem(button)};
    listItem.appendChild(button);

    listItem.setAttribute("data-value", JSON.stringify(profile))

    defenderList.appendChild(listItem);
}
function parseModifier(type, modifier) {
    var modifierData;
    if(type == "modifier-attacker") modifierData = atkModifierData;
    else if(type == "modifier-defender") modifierData = defModifierData;
    var selectedModifier;
    var modVariable;
    for(var i = modifier.length; i > 0; i--) {
        var chkStr = modifier.slice(0, i);
        var matches = modifierData.filter(i => i.name == chkStr);
        if(matches.length == 1) {
            selectedModifier = matches[0];
            var test = testModifier(type, selectedModifier);
            if(test == 1) {
                alert("Modifier of name \"" + selectedModifier.name + "\" already in use");
                return;
            } else if(test == 2) {
                alert("Modifier of type \"" + selectedModifier.type + "\" already in use");
                return;
            }

            if(i != modifier.length) {
                modVariable = modifier.slice(i, modifier.length);
                modVariable = modVariable.replace(" ", "");

                if(modVariable == "" || modVariable == null) break;

                if(selectedModifier.var == false) {
                    alert("Modifier \"" + selectedModifier.name + "\" Does not accept a variable");
                    return;
                }
                
                try {
                    modVariable = parseDiceVariable(modVariable);
                    selectedModifier.value = modVariable;
                } catch(e) {
                    alert("Error parsing variable for modifier \"" + selectedModifier.name + "\"");
                    return;
                }
            } else if(selectedModifier.var == true) {
                alert("Modifier \"" + selectedModifier.name + "\" needs a variable");
                return;
            }
            break;
        }
    }
    if(selectedModifier == null) {
        alert("No modifier matches \"" + modifier + "\"");
        return false;
    }
    return selectedModifier
}
function addModifier(type, modifier) {
    if(modifier.length == 0) return;

    selectedModifier = parseModifier(type, modifier);

    var modifierList = document.getElementById('list-' + type);
    var listItem = document.createElement('li');
    listItem.className = "modListItem";
    listItem.setAttribute("data-value", JSON.stringify(selectedModifier));
    
    var textSpan = document.createElement('span');
    textSpan.textContent = modifier;
    listItem.appendChild(textSpan);

    var button = document.createElement("button");
    button.textContent = "Remove";
    button.onclick = function() {removeListItem(button)};
    listItem.appendChild(button);

    modifierList.appendChild(listItem);
}
function removeListItem(button) {
    button.parentNode.remove();
}
function parseDiceVariable(s) {

    s = s.replace(" ", "");
    s = s.toLowerCase();
    var current = 0;
    var end = s.length;
    var diceMultiplier = 1.0;
    var diceSides = 0.0;
    var value = 0.0;

    function charIsInt(i) {
        return (s.charAt(i) >= '0' && s.charAt(i) <= '9');
    }

    function ensureNextChar(c) {
        if(s.charAt(current) != c || current == end)
            throw new Error();
        current++;
    }
    
    function ensureAndPopNextInt() {
        if(!charIsInt(current) || current == end)
            throw new Error(); 
        var i = current;
        while (charIsInt(i)) i++;
        var next = s.substring(current, i);
        current = i;
        return parseInt(next);
    }

    if(charIsInt(0)) {      
        var temp = ensureAndPopNextInt();
        if(current == end) {
            //temp is value and nothing else
            value = temp;
        } else {
            //temp is multiplier followed by d then dice sides
            diceMultiplier = temp;
            ensureNextChar('d');        
            diceSides = ensureAndPopNextInt();             
            if(current < end) {      
                //expect + followed by value
                ensureNextChar('+');  
                value = ensureAndPopNextInt();   
                if(current != end) throw new Error();
            } 
        }
    } else {
        //expect d followed by dice sides
        ensureNextChar('d');      
        diceSides = ensureAndPopNextInt();
        //if still parts remain, there should be + followed by value
        if(current < end) {      
            ensureNextChar('+');
            value = ensureAndPopNextInt();
            if(current != end) throw new Error();
        } 
    }

    if(diceSides <= 0)
        diceMultiplier = 0;

    var avg = diceMultiplier * (diceSides + 1) / 2 + value;
    var vals = [diceMultiplier, diceSides, value, avg];
    return vals;
}
function getValue(field) {

    var errorIndicator = document.getElementById(field + "-error");
    field = document.getElementById(field);

    if(field.value.length == 0) {
        errorIndicator.textContent = "";
        return;
    }

    try {
        var vals = parseDiceVariable(field.value);
        vals = JSON.stringify(vals);
        field.setAttribute("data-values", vals);
        errorIndicator.textContent = "";
    } catch(e) {
        console.log(e);
        errorIndicator.textContent = "*";
    }
}
function getModifiers(type) {
    var modifierList = document.getElementById('list-modifier-' + type);
    var modifierItems = modifierList.getElementsByTagName('li');
    var modifiers = Array.from(modifierItems);
    return modifiers.map(item => JSON.parse(item.dataset.value));
}
function thresh(i) {
    return ( 7.0 - i ) / 6.0;
}
function roll(probability) {
    var roll = Math.random();
    if(roll <= probability)
        return true;
    return false;
}
function calculateReroll(normThresh, critThresh, rrMod, fishForCrit) {
    //reroll none: rrMod = 0;
    //reroll all: rrMod = 1;
    //reroll 1's: rrMod = 6;
    //reroll 1:   rrMod = attacks
    var px = thresh(normThresh);
    var py = thresh(critThresh);
    if(rrMod == 0) {
        return [Math.max(px - py, 0), py];
    } else {
        var pxrr = px / rrMod;
        var pyrr = py / rrMod;
    }
    var newProbs = [px, py];
    if(fishForCrit) {
        //px = rr succ x * failed prob of y - rr fail x * rerolls unecessary for x succ
        newProbs[0] += pxrr * (1 - py) - (1 - pxrr) * (px - py);
        newProbs[1] += pyrr * (1 - py);
    } else {
        newProbs[0] += pxrr * (1 - px);
        newProbs[1] += pyrr * (1 - px);
    }
    return [newProbs[0] - newProbs[1], newProbs[1]];
}
function tableCalculate() {
    var atkListElement = document.getElementById('list-test-atk')
    var atkListItems = atkListElement.getElementsByTagName('li')
    var atkList = Array.from(atkListItems)
    atkList = atkList.map(item => JSON.parse(item.dataset.value))

    var defListElement = document.getElementById('list-test-def')
    var defListItems = defListElement.getElementsByTagName('li')
    var defList = Array.from(defListItems)
    defList = defList.map(item => JSON.parse(item.dataset.value))

    var table = document.getElementById("output-table");
    var columns = defList.length;
    var rows = atkList.length;
    var inner = "<tr><th></th>";
    for(var i = 0; i < columns; i++) {
        inner += "<th class='column-name'>" + defList[i].tag + "</th>"
    }
    inner += "</tr>";
    
    for(var i = 0; i < rows; i++) {
        inner += "<tr><th class='row-name'>" + atkList[i].tag + "</th>"
        for(var j = 0; j < columns; j++) {
            console.log(i, ", ", j)
            inner += "<td>" + calculate(atkList[i], defList[j], {
                "dmglabel": false,
                "dmg": true,
                "models": false,
                "breakdown": false,
                "simulated": false
            }) + "</td>";
        }
        inner += "</tr>"
    }

    table.innerHTML = inner;
}
function singleCalculate() {
    var outputField = document.getElementById("output");
    var atk = getAttacker()
    var def = getDefender()
    output = calculate(atk, def, outputOptions)
    outputField.textContent += output + "\n\n"
}
function calculate(atk, def, options) {
    console.log(atk)
    console.log(def)
    //modifiers
    var modList = [];
    modList = atk.mods.concat(def.mods);
    modList.sort((a,b) => a.priority - b.priority);

    var modListLow = [];
    var modListHigh = [];

    for(var mod of modList) {
        if(mod.var) while(mod.formula.includes("$var")) {
            mod.formula = mod.formula.replace('$var', mod.value[3]);
        }
        mod.lambda = (function (formula) {
            return function () {
                eval(formula);
            };
        })(mod.formula);
        if(mod.priority < 0) modListLow.push(mod);
        else modListHigh.push(mod);
    }

    //modifier variables

    var modVar = modVars();

    //run low prio modifiers (<0)
    modListLow.forEach(mod => {
        var func = mod.lambda;
        func();
    });

    //determine hit threshold, wound threshold, and save threshold
    var wdVal = 4;
    var bsVal = atk.bs;
    var apVal = atk.ap;
    var svVal = def.sv;

    //wound threshold
    if(def.tgh > atk.str) {
        wdVal++;
        if(def.tgh >= atk.str * 2)
            wdVal++;
    } else if(def.tgh < atk.str) {
        wdVal--;
        if(def.tgh * 2 <= atk.str)
            wdVal--;
    }
    if(modVar.wdMod > 1) modVar.wdMod = 1;
    if(modVar.wdMod < -1) modVar.wdMod = -1;
    wdVal -= modVar.wdMod;
    if(wdVal > modVar.critWoundThresh) wdVal = modVar.critWoundThresh;
    if(wdVal < 2) wdVal = 2;
    if(wdVal > 6) wdVal = 6;

    //hit threshold
    if(modVar.hitMod > 1) modVar.hitMod = 1;
    if(modVar.hitMod < -1) modVar.hitMod = -1;
    bsVal -= modVar.hitMod;
    if(bsVal < 2) bsVal = 2;
    if(bsVal > 6) bsVal = 6;

    //determine probabilities
    var hitResult = calculateReroll(bsVal, modVar.critHitThresh, modVar.hitrrMod, modVar.fishForCritHits);
    var hit = 0.0;
    var critHit = 0.0;
    if(modVar.autoHit) {
        hit = 1;
    } else {
        hit = hitResult[0];
        critHit = hitResult[1];
    }

    var wdResult = calculateReroll(wdVal, modVar.critWoundThresh, modVar.wdrrMod, modVar.fishForCritWounds);
    var wound = wdResult[0];
    var critWd = wdResult[1];
    var woundOffset = 0;
    var mortalWounds = 0;

    //run high prio modifiers
    modListHigh.forEach(mod => {
        console.log(mod.lambda)
        var func = mod.lambda;
        func();
    });
    
    //save threshold
    apVal += modVar.apMod;
    if(modVar.svMod > 1) modVar.svMod = 1;
    if(modVar.svMod < -1) modVar.svMod = -1;
    svVal += apVal - modVar.svMod;
    if(svVal > 7) svVal = 7;
    if(svVal < 2) svVal = 2;

    if(def.inv > 0 && def.inv < 7) svVal = (svVal > def.inv ? def.inv : svVal);
    var save = 1.0 - thresh(svVal);

    if(!options.simulated) {

        var moddedDmg = atk.dmg.avg * modVar.damageModScale + modVar.damageMod;
        if(moddedDmg < 1) moddedDmg = 1;

        var atksPerModelDeath = 0;
        var dmgCounter = 0;
        while(dmgCounter < def.wd) {
            atksPerModelDeath++
            dmgCounter+= atk.dmg.avg;
        }
        //ratio of avg damage needed to kill model versus damaged used
        var overkillRatio = def.wd / (atk.dmg.avg * atksPerModelDeath);

        //base chance of an attack doing damage
        var passProb = (((hit + critHit) * (wound + critWd)) + woundOffset) * save;
        var totalMod = (1 - thresh(def.fnp)) * moddedDmg * atk.count * atk.atk.avg;

        var preOK =  totalMod * passProb;
        var resultFromFailedSaves = preOK * overkillRatio;
        var overkill = preOK - resultFromFailedSaves;

        var resultFromMortalWounds = (1 - thresh(def.mortalFnp)) * moddedDmg * atk.count * atk.atk.avg * mortalWounds;

        var totalDamage = (resultFromFailedSaves + resultFromMortalWounds);
        var modelsKilled = totalDamage / def.wd;

        var output = "";

        if(options.dmg) {
            if(options.dmglabel) output += "Damage Dealt:\t\t\t" 
            output += totalDamage.toFixed(3);
        }
        if(options.models) output += "\n\tModels Killed:\t\t" + modelsKilled.toFixed(3);

        if(options.breakdown) {
            if(resultFromFailedSaves > 0)
                    output += "\n\tFrom Failed Saves:\t" + resultFromFailedSaves.toFixed(3);
            if(overkill > 0)
                    output += "\n\tLost from Overkill:\t" + overkill.toFixed(3);
            if(mortalWounds > 0)
                output += "\n\tFrom Mortal Wounds:\t" + resultFromMortalWounds.toFixed(3);
        }

        return output;
    } else {

    }
}
function loadSelectedToAttacker() {
    if(!selectedProfile) {
        alert("No Profile Selected");
        return;
    }
    var unitData = JSON.parse(selectedUnit.dataset.value);
    var unitName = selectedUnit.dataset.name;
    var profData = JSON.parse(selectedProfile.dataset.value);

    clearModifiers('attacker');

    unitData.globalatkmods.forEach(mod => {
        addModifier('modifier-attacker', mod);
    })

    var nameField = document.getElementById("header-attacker-name");
    var profField = document.getElementById("header-attacker-profile");

    var count = document.getElementById("count")
    var skill = document.getElementById("skill");
    var str = document.getElementById("strength");
    var ap = document.getElementById("ap");
    var attacks = document.getElementById("attacks");
    var damage = document.getElementById("damage");

    count.value = unitData.defstats.models
    skill.value = profData.stats.skill;
    str.value = profData.stats.str;
    ap.value = profData.stats.ap;
    attacks.value = profData.stats.atk;
    getValue('attacks', 'attacks-error');
    damage.value = profData.stats.dmg;
    getValue('damage', 'damage-error');
    profData.mods.forEach(mod => {
        addModifier('modifier-attacker', mod);
    })

    nameField.textContent = unitName;
    profField.textContent = profData.name;
}
function loadSelectedToDefender() {
    if(!selectedUnit) {
        alert("No Unit Selected");
        return;
    }
    var unitData = JSON.parse(selectedUnit.dataset.value);
    var unitName = selectedUnit.dataset.name;

    clearModifiers('defender');

    unitData.defstats.mods.forEach(mod => {
        addModifier('modifier-defender', mod)
    })

    var tgh = document.getElementById("toughness");
    var wd = document.getElementById("wounds");
    var sv = document.getElementById("save");
    var models = document.getElementById("models");
    var inv = document.getElementById("invuln");
    var fnp = document.getElementById("feel-no-pain");
    
    tgh.value = unitData.defstats.tgh;
    wd.value = unitData.defstats.wd;
    sv.value = unitData.defstats.sv;
    models.value = unitData.defstats.models;
    inv.value = unitData.defstats.inv;
    fnp.value = unitData.defstats.fnp;

    var nameField = document.getElementById("header-defender-name");
    nameField.textContent = unitName;
    
}
function modifierInit(modifierData) {
    atkModifierData = modifierData[0].data;
    atkModifierData.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        if (nameA < nameB) {
            return -1; // sort nameA before nameB
        }
        if (nameA > nameB) {
            return 1; // sort nameA after nameB
        }
        return 0; // names are equal, maintain the original order
    });   
    defModifierData = modifierData[1].data;
    defModifierData.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        if (nameA < nameB) {
            return -1; // sort nameA before nameB
        }
        if (nameA > nameB) {
            return 1; // sort nameA after nameB
        }
        return 0; // names are equal, maintain the original order
    }); 
    var atkModList = document.getElementById("options-modifier-attacker");
    for(var i = 0; i < atkModifierData.length; i++) {
        var optionElement = document.createElement('option');
        optionElement.value = atkModifierData[i].name;
        optionElement.textContent = atkModifierData[i].name;
        optionElement.setAttribute("data-value", JSON.stringify(atkModifierData[i]));
        atkModList.appendChild(optionElement);
    }
    var defModList = document.getElementById("options-modifier-defender");
    for(var i = 0; i < defModifierData.length; i++) {
        var optionElement = document.createElement('option');
        optionElement.value = defModifierData[i].name;
        optionElement.textContent = defModifierData[i].name;
        optionElement.setAttribute("data-value", JSON.stringify(defModifierData[i]));
        defModList.appendChild(optionElement);
    }
}
function loadGenericDefensiveLineup() {
    console.log("e")
    unitList = []
    console.log(unitData)
    unitData.forEach( faction => {
        console.log("ee", faction.faction)
        if(faction.faction == "Generic") {
            faction.units.forEach(subset => {
                console.log(subset.name)
                if(subset.name = "Defensive Profiles") {
                    subset.children.forEach( unit => {
                        console.log(unit.name)
                        var defData = unit.data.defstats
                        defData.mods.forEach(mod => {
                            mod = parseModifier('modifier-defender', mod)
                        })
                        defData.tag = unit.name
                        unitList.push(defData)
                    })
                }
            })
        }
    })
    var defenderList = document.getElementById('list-test-def');
    unitList.forEach(profile => {
        console.log(profile.name)
        var listItem = document.createElement('li');
        listItem.className = "modListItem"

        var textSpan = document.createElement('span');
        textSpan.textContent = profile.tag
        listItem.appendChild(textSpan);

        var button = document.createElement("button");
        button.textContent = "Remove";
        button.onclick = function() {removeListItem(button)};
        listItem.appendChild(button);

        listItem.setAttribute("data-value", JSON.stringify(profile))

        defenderList.appendChild(listItem);
    })
}
function unitsInit(statData) {
    unitData = statData;
    var list = document.getElementById("list-units");
    var colorOffset = false;
    //create faction list elements and recursively generate their children
    unitData.forEach(faction => {
        const factionItem = document.createElement("li");
        factionItem.classList.add("unit-select-text");
        factionItem.textContent = faction.faction;
        if(colorOffset) factionItem.classList.add("unit-select-subset-offcolor");
        else factionItem.classList.add("unit-select-subset");
        //event listener to toggle the visibility of the nested list
        factionItem.addEventListener("click", (event) => {
            const nestedList = event.currentTarget.querySelector("ul");
            if (nestedList) {
                nestedList.classList.toggle("unit-select-sublist-visible");
            }
        });

        // create a nested list for the faction's units
        const unitList = createNestedList(faction.units, 1, !colorOffset);
        unitList.classList.add("unit-select-sublist-hidden");
        factionItem.appendChild(unitList);

        // add the faction item to the faction list
        list.appendChild(factionItem);
    });
}
function createNestedList(data, layer, colorOffset) {

    //create a new list for this item
    var list = document.createElement("ul");
    
    data.forEach(item => {
        var listItem = document.createElement("li");
        listItem.classList.add("unit-select-text");
        listItem.textContent = item.name;
        listItem.style.marginLeft = "" + (layer * 5) + "px";
        listItem.style.marginTop = "2px";

        if(item.class == "subset") {

            if(colorOffset) listItem.classList.add("unit-select-subset-offcolor");
            else listItem.classList.add("unit-select-subset");

            listItem.addEventListener("click", (event) => {
                event.stopPropagation()
                var subList = event.currentTarget.querySelector("ul");
                if (subList) {
                    subList.classList.toggle("unit-select-sublist-visible");
                }
            });

            //recursively generate nested list
            subList = createNestedList(item.children, layer + 1, !colorOffset);
            subList.classList.add("unit-select-sublist-hidden");
            listItem.appendChild(subList);
        } else {
            listItem.classList.add("unit-select-item");
            listItem.setAttribute("data-value", JSON.stringify(item.data))
            listItem.setAttribute("data-name", item.name);
            listItem.addEventListener("click", (event) => {
                event.stopPropagation();
                if(selectedUnit) {
                    selectedUnit.classList.remove("unit-select-item-selected");
                    var subList = selectedUnit.querySelector("ul");
                    subList.classList.remove("unit-select-sublist-visible");
                }
                if(selectedProfile) {
                    selectedProfile.classList.remove("unit-select-profile-selected");
                }
                selectedUnit = event.currentTarget;
                var subList = selectedUnit.querySelector("ul");
                selectedUnit.classList.add("unit-select-item-selected");
                subList.classList.add("unit-select-sublist-visible");
            });

            //generate profile list 
            var profList = document.createElement("ul");
            item.data.profiles.forEach( profile => {
                var profileItem = document.createElement("li");
                profileItem.classList.add("unit-select-profile");
                profileItem.textContent = profile.name;
                profileItem.setAttribute("data-value", JSON.stringify(profile));
                profileItem.addEventListener("click", (event) => {
                    event.stopPropagation();
                    if(selectedProfile) {
                        selectedProfile.classList.remove("unit-select-profile-selected");
                    }
                    selectedProfile = event.currentTarget;
                    selectedProfile.classList.add("unit-select-profile-selected");
                });
                profList.appendChild(profileItem);
                profList.classList.add("unit-select-sublist-hidden");
            });
            listItem.appendChild(profList);
        }
        list.appendChild(listItem);
    });

    return list;
}
function init() {
    fetch('modifiers.json')
    .then(response => response.json())
    .then(data => modifierInit(data))
    .catch(error => {
        console.error('Error loading JSON file:', error);
    });
    fetch('output.json')
    .then(response => response.json())
    .then(data => unitsInit(data))
    .catch(error => {
        console.error('Error loading JSON file:', error);
    });
    getValue('damage');
    getValue('attacks');

    var inputFieldDef = document.getElementById('modifier-defender');
    inputFieldDef.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            addModifier('modifier-defender');
        }
    });

    var inputFieldAtk = document.getElementById('modifier-attacker');
    inputFieldAtk.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            addModifier('modifier-attacker');
        }
    });
    generateEmptyTable();
}
function modVars() {
    return {
        "attackerTags" : [],
        "defenderTags" : [],

        "critWoundThresh" : 6,
        "critHitThresh" : 6,

        "critWdMortal" : false,

        "hitMod" : 0,
        "wdMod" : 0,
        "svMod" : 0,

        "apMod" : 0,

        "hitrrMod" : 0,
        "wdrrMod" : 0,

        "autoHit" : false,

        "damageMod" : 0,
        "damageModScale" : 1,

        "fishForCritHits" : false,
        "fishForCritWounds" : false,
    }
}
window.addEventListener('DOMContentLoaded', init);