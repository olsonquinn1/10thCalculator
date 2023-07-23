import pandas as pd
import numpy as np
import json

class Group:
    def __init__(self, name):
        self.name = name
        self.data = []
    
    def toString(self, layer):
        s = self.name
        for d in self.data:
            s += ("\n" + ("\t" * layer) + d.toString(layer + 1))
        return s

class Unit:
    def __init__(self, name):
        self.name = name
        self.profiles = []
        self.defstats = DefStats()
        self.globalatkmods = []
        self.modelCost = []
    
    def toString(self, layer):
        s = ""
        s += self.name + self.defstats.toString(layer) + "\n" + ("\t" * layer) + "global atk mods: " + str(self.globalatkmods)
        for profile in self.profiles:
            s += profile.toString(layer)
        return s

class Profile:
    def __init__(self, name):
        self.name = name
        self.stats = ProfileStats()
        self.mods = []

    def toString(self, layer):
        return "\n" + ("\t" * layer) + self.name + self.stats.toString(layer + 1) \
            + "\n" + ("\t" * (layer + 1)) + "Mods: " + str(self.mods)

class ProfileStats:
    def __init__(self):
        self.atk = 69
        self.skill = 69
        self.str = 69
        self.ap = 69
        self.dmg = 69

    def toString(self, layer):
        s = "\n" + ("\t" * layer) + "a " + str(self.atk) + ", sk "+ str(self.skill) + "+, str " + str(self.str) \
            + ", ap " + str(self.ap) + ", d " + str(self.dmg)
        return s

    def toDict(self):
        return {
            "atk": str(self.atk),
            "skill": str(self.skill),
            "str": str(self.str),
            "ap": str(self.ap),
            "dmg": str(self.dmg),
        }

class DefStats:
    def __init__(self):
        self.tgh = 69
        self.wd = 69
        self.sv = 69
        self.models = 69
        self.inv = 7
        self.fnp = 7
        self.mods = []
    
    def toString(self, layer):
        s = "\n" + ("\t" * layer) + str(self.models) + "x t "+ str(self.tgh) + ", w " + str(self.wd) \
            + ", sv " + str(self.sv) + "+, inv " + str(self.inv) + "+, fnp " + str(self.fnp) + "+"
        s += "\n" + ("\t" * layer) + "Mods: " + str(self.mods)
        return s

    def toDict(self):
        return {
            "tgh": str(self.tgh),
            "wd": str(self.wd),
            "sv": str(self.sv),
            "models": str(self.models).split(" ")[0],
            "inv": str(self.inv),
            "fnp": str(self.fnp),
            "mods": self.mods,
        }

def parseModelCosts(ptStr, modelStr):
    output = []
    if type(ptStr) == int:
        return [[ptStr, modelStr]]
    ptStr = ptStr.split(" ")
    modelStr = modelStr.split(" ")
    for i in range(len(ptStr)):
        output.append([int(ptStr[i]), int(modelStr[i])])
    return output

def parseMods(codeList):
    global atkModDict
    global defModDict
    codeList = codeList.split(',')
    for i in range(len(codeList)):
        if codeList[i][0] == " ":
            codeList[i] = codeList[i][1:len(codeList[i])]
        codeList[i] = codeList[i].split(' ')
    defMods = []
    atkMods = []
    for code in codeList:
        mod = None
        try:
            mod = defModDict[code[0]]
        except:
            try:
                mod = atkModDict[code[0]]
            except:
                continue
            if len(code) > 1:
                atkMods.append(mod + " " + code[1])
            else:
                atkMods.append(mod)
            continue
        if len(code) > 1:
            defMods.append(mod + " " +  code[1])
        else:
            defMods.append(mod)
    return [defMods, atkMods]

def generateDefStats(inputList):
    output = DefStats()
    output.tgh = int(inputList[0])
    output.sv = int(inputList[1])
    output.wd = int(inputList[2])
    output.inv = int(inputList[3]) if not np.isnan(inputList[3]) else 7
    output.fnp = int(inputList[4]) if not np.isnan(inputList[4]) else 7
    return output

def generateProfStats(inputList):
    output = ProfileStats()
    output.atk = inputList[0]
    output.skill = int(inputList[1])
    output.str = int(inputList[2])
    output.ap = int(inputList[3])
    output.dmg = inputList[4]
    return output

data = pd.read_excel('UnitRepository.xlsx')

#create dictionary of modifier codes
modData = data.loc[:, 'code':'var'].values.tolist()
atkModDict = {}
defModDict = {}
secondList = False
for row in modData:
    if not type(row[0]) == type("a"):
        if secondList: break
        else:
            secondList = True
            continue
    if not secondList:
        atkModDict[row[0]] = row[1]
    else:
        defModDict[row[0]] = row[1]

root = Group("root")

#iterate factions
factionRow = data.loc[:,'Faction'].first_valid_index()
while(factionRow != data.shape[0]):
    nextFactionRow = data.loc[factionRow + 1:,'Faction'].first_valid_index()
    if(nextFactionRow == None):
        nextFactionRow = data.shape[0]
    facName = data.loc[factionRow, 'Faction']
    facRoot = Group(facName)
    root.data.append(facRoot)
    unitRow = data.loc[factionRow:, 'Unit'].first_valid_index()
    subgroupTracker = []
    while(unitRow < nextFactionRow):
        nextUnitRow = data.loc[unitRow + 1:, 'Unit'].first_valid_index()

        if(nextUnitRow == None):
            nextUnitRow = data.shape[0]

        name:str = data.loc[unitRow, 'Unit']

        if(name[0] == '$'):
            subgroupLevel = name.count("$")
            name = name.replace("$", "")
            subset = Group(name)
            if subgroupLevel > len(subgroupTracker):
                if subgroupLevel == 1:
                    facRoot.data.append(subset)
                else:
                    subgroupTracker[-1].data.append(subset)
                subgroupTracker.append(subset)

            elif subgroupLevel == len(subgroupTracker):
                subgroupTracker[-1] = subset
                if subgroupLevel > 1:
                    subgroupTracker[-2].data.append(subset)
                else:
                    facRoot.data.append(subset)

            else:
                diff = len(subgroupTracker) - subgroupLevel
                subgroupTracker = subgroupTracker[0:(diff * -1)]
                subgroupTracker[-1] = subset
                if subgroupLevel > 1:
                    subgroupTracker[-2].data.append(subset)
                else:
                    facRoot.data.append(subset)
        else:
            unit = Unit(name)
            statData = data.loc[unitRow, 'Unit':'Mods'].values.tolist()

            unit.modelCost = parseModelCosts(statData[1], statData[2])
            unit.defstats = generateDefStats(statData[3:8])
            unit.defstats.models = statData[2]
            mods = parseMods(statData[8])
            unit.defstats.mods = mods[0]
            unit.globalatkmods = mods[1]

            profileData = data.loc[unitRow:nextUnitRow-1, 'Profiles':'ProfMods'].values.tolist()
            for profile in profileData:
                if type(profile[0]) != str:
                    break
                p = Profile(profile[0])
                p.stats = generateProfStats(profile[1:6])

                if type(profile[6]) == str:
                    modList = parseMods(profile[6])
                    p.mods = modList[1]
                unit.profiles.append(p)
            
            subgroupTracker[-1].data.append(unit)
        unitRow = nextUnitRow
    factionRow = nextFactionRow

#print(root.toString(1))

#create json structure from data
jsonroot = []

def generateJson(subset):
    s = {}
    s["class"] = "subset"
    s["name"] = subset.name
    s["children"] = []
    for item in subset.data:
        if type(item) == Group:
            i = generateJson(item)
            s["children"].append(i)
        elif type(item) == Unit:
            u = {}
            u["class"] = "unit"
            u["name"] = item.name
            u["data"] = {}
            u["data"]["defstats"] = item.defstats.toDict()
            u["data"]["globalatkmods"] = item.globalatkmods
            u["data"]["profiles"] = []
            for profile in item.profiles:
                p = {}
                p["name"] = profile.name
                p["stats"] = profile.stats.toDict()
                p["mods"] = profile.mods
                u["data"]["profiles"].append(p)
            s["children"].append(u)
    return s

for faction in root.data:
    f = {}
    f["class"] = "set"
    f["faction"] = faction.name
    f["units"] = []
    for subset in faction.data:
        s = generateJson(subset)
        f["units"].append(s)
    jsonroot.append(f)

json_obj = json.dumps(jsonroot, indent=4)

with open("output.json", "w") as outfile:
    outfile.write(json_obj)