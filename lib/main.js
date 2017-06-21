import "witheve/build/src/watchers/html";
import "witheve/build/src/watchers/ui";
import "witheve/build/src/watchers/compiler";
import "witheve/build/src/watchers/tag-browser";
import {Program, createId, watcherPath} from "witheve";

// gf stuff

var online_options={
  grammar_list: ["Actions.pgf"],
}

if(window.grammar_list) online_options.grammar_list=grammar_list

var minibar_options= {
    show_abstract: true,
    show_trees: true,
//  tree_img_format: "png", // or "svg"
    show_grouped_translations: false,
    show_brackets: true,
    word_replacements: true,
    default_source_language: "Eng",
    //feedback_url: "feedback.html",
    try_google: true
}

if(/^\?\/tmp\//.test(location.search)) {
    var args=decodeURIComponent(location.search.substr(1)).split(" ")
    if(args[0]) online_options.grammars_url=args[0];
    if(args[1]) minibar_options.initial_grammar=args[1];
}

var server=pgf_online(online_options);
window.server = server;

function linSexpOutside(obj) {
    let result = "(";
    result += linSexpInside(obj);
    result += ")";
    return result;
}

function linSexpInside(obj) {
    let result = obj.a0;
    let i = 1;
    while (obj["a" + i] !== undefined) {
        result += " ";
        if (typeof obj["a" + i] === 'object') {
            result += linSexpOutside(obj["a" + i]);
        } else {
            result += obj["a" + i];
        }
        i++;
    }
    return result;
}

function parseSexpr(sexpr) {
    let tokens = sexpr.match(/(\(|\)|[^\s()"]+)/g)
    let [result, p] = parseInside(tokens, 0);
    return result;
}

function exGotAt(ex, got, at) {
    throw "Expected '" + ex + "', got '" + got + "' at '" + at "'";
}

function parseOutside(tokens, p) {
  let result;
  if (tokens[p] != '(') {
      exGotAt('(', tokens[p], p);
  }
  p++;
  [result, p] = parseInside(tokens, p);
  if (tokens[p] != ')') {
      exGotAt(')', tokens[p], p);
  }
  p++;
  return [result, p];
}

function parseInside(tokens, p) {
    let result = {};
    result.a0 = tokens[p];
    p++;
    let i = 1;
    while (p < tokens.length && tokens[p] != ')') {
        if (tokens[p] == '(') {
            [result["a" + i], p] = parseOutside(tokens, p);
        } else {
            result["a" + i] = tokens[p];
            p++;
        }
        i++;
    }
    return [result, p];
}

function visitTree(f, t) {
    f(t);
    let i = 0;
    while (t["a" + i] !== undefined) {
        if (typeof t["a" + i] === 'object') {
            visitTree(f, t["a" + i]);
        }
        i++;
    }
}

function appendTreeAsEAVs(eavs, t) {
    let id = createId();
    eavs.push([id, "tag", t.a0]);
    let i = 0;
    while (t["a" + i] !== undefined) {
        if (typeof t["a" + i] === 'object') {
            let sub_id = appendTreeAsEAVs(eavs, t["a" + i]);
            eavs.push([id, "a" + i, sub_id]);
        } else {
            eavs.push([id, "a" + i, t["a" + i]]);
        }
        i++;
    }
    return id;
}

function with_grammar(server, grammar, cont) {
    let saved = server.current_grammar_url;
    server.switch_grammar(grammar);
    cont();
    server.current_grammar_url = saved;
}

function getNumberTree(sexprTree) {
    let objTree = parseSexpr(sexprTree);
    let to_resolve = [];
    visitTree((subtree) => {
        if (subtree.a0 !== 'NNumeral') {
            return;
        }
        to_resolve.push(new Promise((resolve, reject) => {
            with_grammar(server, "Numeral.pgf", () => {
                let number = linSexpOutside(subtree.a1);
                server.linearize({tree: number}, (c) => {
                    subtree.a1 = parseInt(c[0].text);
                    resolve();
                });
            });
        }));
    }, objTree);
    return Promise.all(to_resolve).then(() => objTree);
}

function deNumberTree(objTree) {
    let to_resolve = [];
    visitTree((subtree) => {
        if (subtree.a0 !== 'NNumeral') {
            return;
        }
        to_resolve.push(new Promise((resolve, reject) => {
            with_grammar(server, "Numeral.pgf", () => {
                let digits = subtree.a1 + "";
                // tokenize
                digits = digits.split("").join(" ");
                server.parse({
                        input: digits,
                        from: 'decimal',
                        cat: 'Numeral'}, (c) => {
                    subtree.a1 = parseSexpr(c[0].trees[0]);
                    resolve();
                });
            });
        });
    }, objTree);
    return Promise.all(to_resolve).then(() => linSexpOutside(objTree));
}

window.parseSexpr = parseSexpr;

// eve stuff

let program = new Program("balticdrugwars");

// gf watcher

function appendResultAsEAVs(eavs, input, result, req_id) {
    let to_resolve = [];
    let result_id = createId();
    eavs.push([req_id, "result", result_id]);
    eavs.push([result_id, "from", result.from]);
    if (result.incomplete) {
        eavs.push([result_id, "tag", "incomplete"]);
    } else if (result.parseFailed) {
        eavs.push([result_id, "tag", "failed"]);
        eavs.push([result_id, "failed-at", result.parseFailed]);
        let tokens = input.split(" ");
        console.log('failed-word', tokens[result.parseFailed - 1]);
        eavs.push(
            [result_id, "failed-word", tokens[result.parseFailed - 1]]);
    } else {
        for (let tree of result.trees) {
            let ft_prom = getNumberTree(tree);
            to_resolve.push(ft_prom.then((ft) => {
                console.log(ft);
                let tree_id = appendTreeAsEAVs(eavs, ft);
                eavs.push([result_id, "tree", tree_id]);
            }));
        }
    }
    return Promise.all(to_resolve);
}

if (location.hash === '#debug') {
    program.attach('tag browser');
    program.inputEAVs([[createId(), 'tag', 'debug']]);
}

function shallowGatherEAVs(eavs, multi) {
    let add_objs = {};
    for (let [e, a, v] of eavs) {
        if (add_objs[e] === undefined) {
            add_objs[e] = {};
            for (let m of multi) {
                add_objs[e][m] = [];
            }
        }
        if (multi !== undefined && multi.indexOf(a) !== -1) {
            add_objs[e][a].push(v);
        } else {
            add_objs[e][a] = v;
        }
    }
    return add_objs;
}

program.watch("Pass on parse commands to GF", ({find, lookup, record, choose}) => {
    let parse_cmd = find("gf/parse");
    //console.log('watch');
    //console.log('parse_cmd', parse_cmd);
    return [
        record({
            id: parse_cmd,
            input: parse_cmd.input,
            cat: choose(
                () => { parse_cmd.cat; return parse_cmd.cat },
                () => { true; return "" }),
        })
        //parse_cmd
    ];
}).asObjects(({adds, removes}) => {
    //console.log('asObjects');
    //console.log(adds);
    for(let rec_id in adds) {
        let {id: req_id, input, cat} = adds[rec_id];
        let args = {input};
        if (cat) {
            args.cat = cat;
        }
        server.parse(args, function(c) {
            console.log('raw', c);
            let eavs = [];
            let to_resolve = [];
            for (let result of c) {
                to_resolve.push(appendResultAsEAVs(eavs, input, result, req_id));
            }
            Promise.all(to_resolve).then(() => {
                console.log('inputting');
                program.inputEAVs(eavs);
            });
        });
    }
});

var lin_requests = [];
var to_resolve = {}

function processResolvedRequests() {
    let eavs = [];
    to_resolve = [];
    lin_requests = lin_requests.filter((lin_request) => {
        if (lin_request.unresolved !== 0) {
            return true;
        }
        //console.log('WOW! got a tree', lin_request.tree);
        to_resolve.push(new Promise((resolve, reject) => {
            deNumberTree(lin_request.tree).then((sexprTree) => {
                server.linearize({
                    tree: sexprTree,
                    to: lin_request.to
                }, function(c) {
                    console.log(c);
                    console.log('putting result on' lin_request.req);
                    eavs.push([lin_request.req, "result", c[0].text]);
                    resolve();
                });
            })
        }));
        return false;
    });
    console.log('to resolve', to_resolve);
    Promise.all(to_resolve).then(() => {
        console.log('all resolved');
        if (eavs.length) {
            console.log('EAVS', eavs);
            program.inputEAVs(eavs);
        }
    });
}

function isID(v: any) {
  return typeof v === "string" && (v.indexOf("|") > -1 || (v[8] === "-" && v.length === 36))
}

function addToResolve(eid, req, obj, key) {
    if (!to_resolve[eid]) {
        to_resolve[eid] = [];
    }
    to_resolve[eid].push([req, obj, key]);
}

program.watch("Pass on lin commands to GF", ({find, lookup, record}) => {
    let req = find("gf/lin");

    return [
      record({req, to: req.to, tree: req.tree})
    ];
}).asObjects(({adds, removes}) => {
    let eavs = [];
    for(let rec_id in adds) {
        console.log('LIN', adds[rec_id]);
        let {req, tree, to} = adds[rec_id];
        let lin_request = {
            req,
            to,
            unresolved: 1
        };
        let payload = {};
        addToResolve(tree, lin_request, lin_request, 'tree');
        lin_requests.push(lin_request);
        // TODO: Support multiple lin requests
        // XXX: Would use tag or at least same attribute, but watchers only
        // supports single value per attribute currently
        eavs.push([tree, 'tag', 'gf/to-copy']);
        eavs.push([tree, 'gf/to-copy', tree]);
    }
    //console.log('EAVS', eavs);
    program.inputEAVs(eavs);
}).watch("Pass on lin commands to GF", ({find, lookup, record, gather, choose}) => {
    let to_copy = find('gf/to-copy');

    let {attribute, value} = lookup(to_copy);

    /*let to_copy = gather(to_copy['gf/to-copy']).per(to_copy).count();
    let copied = choose(
        () => { to_copy['gf/copied']; return gather(to_copy['gf/copied']).per(to_copy).count(); },
        () => 0);
    to_copy > copied;*/

    //not(() => not(() => to_copy['gf/to-copy'] == to_copy['gf/copied']));
    //not(() => to_copy == find({'gf/copied': to_copy['gf/to-copy']}));

    let rec = record({id: to_copy, tree: to_copy['gf/to-copy']});
    rec.add(attribute, value);

    return [rec];
}).asDiffs(({adds, removes}) => {
    // XXX: Filtering here in Javascript rather than in Eve
    let add_objs = shallowGatherEAVs(adds, ['gf/copied', 'gf/to-copy']);
    //let add_objs = shallowGatherEAVs(adds);
    let eavs = [];
    console.log(Object.keys(add_objs).length);
    for (let key in add_objs) {
        console.log('key', key);
        let to_copy = add_objs[key];
        console.log('to_copy', to_copy);
        if (to_copy['gf/copied'].length >= to_copy['gf/to-copy'].length) {
            continue;
        }
        let resolved;
        if (!to_resolve[to_copy.id]) {
            continue;
        }
        while (resolved = to_resolve[to_copy.id].pop()) {
            let [req, obj, key] = resolved;
            //console.log('to_copy', req, obj, key);
            let copied = {};
            req.unresolved--;
            for (let child_key in to_copy) {
                if (child_key[0] !== 'a') {
                    continue;
                }
                copied[child_key] = to_copy[child_key];
                if (!isID(to_copy[child_key])) {
                    continue;
                }
                req.unresolved++;
                //console.log('adding to_resolve', child_key, req, copied, child_key);
                addToResolve(to_copy[child_key], req, copied, child_key);
                console.log('to_copy')
                eavs.push([to_copy[child_key], 'tag', 'gf/to-copy']);
                eavs.push([to_copy[child_key], 'gf/to-copy', to_copy.tree]);
            }
            obj[key] = copied;
            eavs.push([to_copy.id, 'gf/copied', to_copy.tree]);
        }
    }
    //console.log('EAVS', eavs);
    if (eavs.length) {
        program.inputEAVs(eavs);
    }
    processResolvedRequests();
});

// eve code

program.attach("ui");

program.load(`
Commodities
~~~
commit
  [#ship money: 100 turn: 0 look-idx: 0]
  cheese = [#item name: "Cheese" price-floor: 1 price-ceil: 5 amt-floor: 3 amt-ceil: 8]
  wine = [#item name: "Wine" price-floor: 5 price-ceil: 10 amt-floor: 16 amt-ceil: 32]
  fish = [#item name: "Fish" price-floor: 10 price-ceil: 20 amt-floor: 5 amt-ceil: 12]
  [#stock of: cheese amt: 0]
  [#stock of: wine amt: 0]
  [#stock of: fish amt: 0]
~~~
Create some random offers
~~~
search
  [#ship turn]
  not([#offer turn])
  for = [#item price-floor price-ceil amt-floor amt-ceil]

  num-offers = math/floor[value: random/number[seed: (turn, for)] * 5] + 1
  offer-idx = math/range[start: 1, stop: num-offers]

  rand-seed = "{{turn}} {{for.name}} {{offer-idx}}"
  price-range = price-ceil - price-floor
  price = math/floor[value:
    random/number[seed: "{{rand-seed}} 1"] * price-range
  ] + price-floor

  amt-range = amt-ceil - amt-floor
  amt = math/floor[value:
    random/number[seed: "{{rand-seed}} 2"] * amt-range
  ] + amt-floor
commit
  [#offer turn offer-idx for amt price]
~~~
Put them in a random order
~~~
search
  [#ship turn]
  offer = [#offer turn]
  rand = random/number[seed: offer]
  look-idx = gather/sort[for: rand, direction: "up"]
commit
  offer.look-idx := look-idx
  offer.rand := rand
~~~
Trace them out
~~~
search
  [#debug]
  offer = [#offer for amt price offer-idx look-idx rand]
bind
  [#ui/div text: "offer {{offer-idx}}, {{look-idx}} {{rand}}: {{amt}} crates of {{for.name}} for {{price}} euros"]
~~~
Get rid of old offers
~~~
search
  [#ship]
  offer = [#offer]
  ship.turn != offer.turn
commit
  offer := none
~~~
Make sure we have all the current offers in the current langauge
~~~
search
  offer = [#offer for amt price]
  [#current-location grammar]
commit
  offer-tree = [a0: "OfferAt" a1: [a0: "mkCommodityQuantity" a1: for.name a2: [a0: "NNumeral" a1: amt]] a2: [a0: "Euros" a1: [a0: "NNumeral" a1: price]]]
  look-lin = [#gf/lin tree: [a0: "LookAround" a1: offer-tree] to: grammar]
  lin = [#gf/lin tree: offer-tree to: grammar]
  offer.lin := lin
  offer.look-lin := look-lin
~~~
Look up table for response phrases:
~~~
commit
  [#response resp: "notvalid" lang: "en" text: "I don't understand"]
  [#response resp: "notvalid" lang: "fi" text: "Minä en ymmärrä"]
  [#response resp: "notvalid" lang: "sv" text: "Jag förstå inte"]

  [#response resp: "wronglang" lang: "en" text: "Speak English!"]
  [#response resp: "wronglang" lang: "fi" text: "Puhu Suomea!"]
  [#response resp: "wronglang" lang: "sv" text: "Tala Svenska!"]
~~~
Look up table for locations:
~~~
commit
  [#location name: "London" grammar: "ActionsEng" lang: "en"]
  [#location name: "Helsinki" grammar: "ActionsFin" lang: "fi"]
  [#location name: "Stockholm" grammar: "ActionsSwe" lang: "sv"]
~~~
Initial state
~~~
search
  london = [#location name: "London"]
commit
  [#output text: "You arrive in London" idx: 0]
  london += #current-location
~~~
Dialog container.
~~~
commit
  [#ui/div #dialog]
~~~
Outputs.
~~~
search
  dialog = [#dialog]
  output = [#output idx]
commit
  output += #ui/div
  output.sort := idx * 2
  dialog.children += output
~~~
Old inputs.
~~~
search
  dialog = [#dialog]
  [#input-record value idx]
commit
  dialog.children += [#ui/div text: "> {{value}}" sort: idx * 2 + 1]
~~~
Keep track of the number of pieces of dialog so far.
~~~
search
  inputs =
    if input-records = [#input-record] then
      gather/count[given: input-records]
    else 0
bind
  [#num-dialogs num: inputs]
~~~
Current input
~~~
search
  [#num-dialogs num]
  dialog = [#dialog]
bind
  dialog.children += [#ui/input sort: num * 2 + 1 #html/trigger/focus autofocus: "true"]
~~~
Parse and archive new inputs
~~~
search
  [#num-dialogs num]
  [#html/event/key-down key: "enter" element: [#ui/input value]]
commit
  [#gf/parse idx: num input: value cat: "CommandUtt"]
  [#input-record value idx: num]
~~~
Getting responses
~~~
search
  [#num-dialogs num]
  [#gf/parse idx: num - 1 result]
  [#current-location grammar]
  result = [from: grammar tree]
bind
  tree += #current-tree
~~~
Look around
~~~
search
  [#num-dialogs num]
  tree = [#current-tree not(#processed) a1: "LookAction"]
  ship = [#ship money turn look-idx]
  num-offer = gather/count[given: [#offer]]
  real-look-idx = math/mod[value: look-idx, by: num-offer] + 1
  offer = [#offer turn for: item price look-lin look-idx: real-look-idx]
commit
  tree += #processed
  ship.look-idx := look-idx + 1
  output = [#output idx: num]
  output.children += [#ui/div text: look-lin.result]
~~~
Check money
~~~
search
  [#num-dialogs num]
  ship = [#ship money]
  tree = [#current-tree not(#processed) a1: "CheckMoney"]
commit
  [#output text: "You have {{money}} euroes" idx: num]
~~~
Check inventory - have something
~~~
search
  [#num-dialogs num]
  tree = [#current-tree not(#processed) a1: "CheckInventory"]
  [#stock quantity item]
commit
  [#output idx: num children: [#ui/ul children:
    [#ui/li text: "{{quantity}} crates of {{item.name}}"]]]
~~~
Check inventory - nothing
~~~
search
  [#num-dialogs num]
  tree = [#current-tree not(#processed) a1: "CheckInventory"]
  not([#stock])
commit
  [#output idx: num text: "Your stores are empty"]
~~~
Selling (incomplete)
~~~
search
  [#num-dialogs num]
  tree = [#current-tree a1: [a1: "Sell" a2: [#mkCommodityQuantity a1: [a1: item], a2: [#NNumeral a1: quantity]]]]
commit
  [#output text: "You sell {{quantity}} crates of {{item}}" idx: num]
~~~
Buying stuff
~~~
search
  [#current-tree a1: [a1: "Buy" a2: [a1: [#mkCommodityQuantity a1: item a2: [#NNumeral a1: quantity]] a2: [#Euros a1: [a1: price]]]]]
commit
  [#buy quantity item price]
~~~
Trace buys
~~~
search
  [#debug]
  [#buy quantity item price]
commit
  [#ui/div text: "Buy {{quantity}} {{item}} {{price}}"]
~~~
Make a #try-buy when a potential offer is identified. We must limit it to one offer.
~~~
search
  buy = [#buy quantity item: item-name price not(#executed)]
  item = [#item name: item-name]
  offer = [#offer for: item price amt]
  gather/sort[for: offer] = 1
bind
  [#try-buy buy offer item]
~~~
~~~
search
  [#try-buy buy offer item]
bind
  [#ui/div text: "try-buy {{buy}} {{offer}} {{item}}"]
~~~
Enough money
~~~
search
  [#num-dialogs num]
  [#try-buy buy offer item]
  buy = [quantity price]
  offer = [price amt]
  ship = [#ship money]
  quantity * price <= money
  quantity <= amt
commit
  buy += #executed
  ship.money := money - quantity * price
  offer.amt := amt - quantity
  ship.stock += [#stock quantity item]
  [#output text: "You buy {{quantity}} crates of {{item.name}}" idx: num]
~~~
Get rid of old offers
~~~
search
  offer = [#offer amt: 0]
commit
  offer := none
~~~
Can't buy - not enough money
~~~
search
  [#num-dialogs num]
  [#try-buy buy offer item]
  buy = [quantity price]
  offer = [price amt]
  ship = [#ship money]
  quantity * price > money
commit
  buy += #executed
  [#output text: "You don't have enough money" idx: num]
~~~
Can't buy - not enough on offer
~~~
search
  [#num-dialogs num]
  [#try-buy buy offer item]
  buy = [quantity price]
  offer = [price amt]
  ship = [#ship money]
  amt < quantity
commit
  buy += #executed
  [#output text: "Not enough on offer" idx: num]
~~~
Selling stuff
~~~
search
  [#num-dialogs num]
  tree = [#current-tree a1: [a0: "Sell" a1: [#mkCommodityQuantity a0: [a0: item], a1: [#NNumeral a0: quantity]]]]
commit
  [#output text: "You sell {{quantity}} crates of {{item}}" idx: num]
~~~
Set sail!
~~~
search
  [#num-dialogs num]
  tree = [#current-tree a1: [#JetAction a1: dest]]
  ship = [#ship turn]
  current-location = [#current-location]
  dest-location = [#location name: dest]
commit
  tree += #processed
  ship.look-idx := 0
  ship.turn := turn + 1
  current-location -= #current-location
  dest-location += #current-location
  [#output text: "You arrive in {{dest}}" idx: num]
~~~
Wrong language fallback
~~~
search
  [#num-dialogs num]
  [#gf/parse idx: num - 1 result: failed-result result: success-result]
  // current location fails
  [#current-location grammar lang]
  failed-result = [from: grammar not(tree)]
  // exists a successfull one
  success-result = [tree: [not(#processed)]]

  [#response resp: "wronglang" lang text]
commit
  [#output text idx: num]
~~~
Incomplete or parseFailed
~~~
search
  [#num-dialogs num]
  [#current-location lang grammar]
  parse = [#gf/parse idx: num - 1 result]
  not(parse.result.tree)
  result = [from: grammar]
  extra = if result = [#incomplete] then "..."
          else if result = [#failed failed-word] then " '{{failed-word}}'"
  [#response resp: "notvalid" lang text]
commit
  [#output text: "{{text}}{{extra}}" idx: num]
~~~
Last fallback response
~~~
search
  dialog = [#dialog]
  [#num-dialogs num]
  1 <= num
  idx = math/range[start: 1, stop: num]
  not([#output idx])
bind
  dialog.children += [#ui/div text: "I don't have a response to that" sort: idx * 2]
~~~`);
