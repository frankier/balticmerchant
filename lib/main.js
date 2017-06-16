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
console.log(server);
window.server = server;

function linSexpOutside(obj) {
    let result = "(";
    result += linSexpInside(obj);
    result += ")";
    return result;
}

function linSexpInside(obj) {
    let result = obj.tag;
    let i = 0;
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
    result.tag = tokens[p];
    p++;
    let i = 0;
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
    eavs.push([id, "tag", t.tag]);
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

function getFriendlyTree(sexprTree) {
    let objTree = parseSexpr(sexprTree);
    let to_resolve = [];
    visitTree((subtree) => {
        if (subtree.tag !== 'NNumeral') {
            return;
        }
        to_resolve.push(new Promise((resolve, reject) => {
            with_grammar(server, "Numeral.pgf", () => {
                console.log(subtree);
                console.log('XXX');
                console.log(subtree.a0);
                let number = linSexpOutside(subtree.a0);
                console.log('number', number);
                server.linearize({tree: number}, (c) => {
                    subtree.a0 = parseInt(c[0].text);
                    resolve();
                });
            });
        }));
    }, objTree);
    return Promise.all(to_resolve).then(() => objTree);
}

window.parseSexpr = parseSexpr;

// eve stuff

let program = new Program("balticdrugwars");

// gf watcher

function appendResultAsEAVs(eavs, result, req_id, to_resolve) {
    let result_id = createId();
    eavs.push([req_id, "result", result_id]);
    eavs.push([result_id, "from", result.from]);
    if (result.incomplete) {
        eavs.push([result_id, "tag", "incomplete"]);
    } else if (result.parseFailed) {
        console.log('parseFailed', result);
        eavs.push([result_id, "tag", "failed"]);
        eavs.push([result_id, "failed-at", result.parseFailed]);
        if (result.brackets.children.length) {
            console.log(
            eavs.push(
                [result_id, "failed-word",
                 result.brackets.children[result.parseFailed - 2].token]);
        }
    } else {
        for (let tree of result.trees) {
            let ft_prom = getFriendlyTree(tree);
            to_resolve.push(ft_prom.then((ft) => {
                console.log('ft', ft);
                let tree_id = appendTreeAsEAVs(eavs, ft);
                eavs.push([result_id, "tree", tree_id]);
            }));
        }
    }
}

program.watch("Pass on parse commands to GF", ({find, lookup, record}) => {
    let parse_cmd = find("gf/parse");
    //console.log('watch');
    //console.log('parse_cmd', parse_cmd);
    return [
        record({id: parse_cmd, input: parse_cmd.input})
        //parse_cmd
    ];
}).asObjects(({adds, removes}) => {
    console.log('asObjects');
    console.log(adds);
    for(let rec_id in adds) {
        let {id: req_id, input} = adds[rec_id];
        server.parse({input}, function(c) {
            let eavs = [];
            let to_resolve = [];
            for (let result of c) {
                appendResultAsEAVs(eavs, result, req_id, to_resolve);
            }
            Promise.all(to_resolve).then(() => {
                console.log('inputting', eavs);
                program.inputEAVs(eavs);
            });
        });
    }
})

// eve code

program.attach("ui");

program.load(`
Look up table for response phrases:
~~~
commit
  [#reponse resp: "notvalid" lang: "en" text: "I don't understand"]
  [#reponse resp: "notvalid" lang: "fi" text: "Minä en ymmärrä"]
  [#reponse resp: "notvalid" lang: "sv" text: "Jag förstå inte"]

  [#reponse resp: "wronglang" lang: "en" text: "Speak English!"]
  [#reponse resp: "wronglang" lang: "fi" text: "Puhu Suomea!"]
  [#reponse resp: "wronglang" lang: "sv" text: "Tala Svenska!"]
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
  (text, idx) = if [#output text idx] then (text, idx)
                if [#fallback-output text idx] then (text, idx)
commit
  dialog.children += [#ui/div text sort: idx * 2]
~~~
Old inputs.
~~~
search
  dialog = [#dialog]
  output = [#input-record value idx]
commit
  dialog.children += [#ui/div text: value sort: idx * 2 + 1]
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
  dialog.children += [#ui/input sort: num * 2 + 1]
~~~
Parse and archive new inputs
~~~
search
  [#num-dialogs num]
  [#html/event/key-down key: "enter" element: [#ui/input value]]
commit
  [#gf/parse idx: num input: value]
  [#input-record value idx: num]
~~~
Buying stuff
~~~
search
  [#num-dialogs num]
  [#gf/parse idx: num - 1 result]
  [#current-location grammar]
  result = [from: grammar tree]
  //tree = [a0: [a0: "Buy"]]
  tree = [a0: [a0: "Buy" a1: [#mkCommodityQuantity a0: [a0: buy-item], a1: [#NNumeral a0: buy-quantity]]]]
commit
  [#output text: "You buy {{buy-quantity}} crates of {{buy-item}}" idx: num]
  //[#output text: "You buy a thing" idx: num]
~~~
Getting a response
~~~
search
  parse = [#gf/parse result]
  [#num-dialogs num]
commit
  [#ui/div text: "A RESPONSE!"]
  [#ui/div text: "idx: {{parse.idx}}"]
  [#ui/div text: "dialogs: {{num}}"]
  [#ui/div text: result.from]
~~~
Fallback response
~~~
search
  [#num-dialogs num]
  1 <= num
  idx = math/range[start: 1, stop: num]
  not([#output idx])
bind
  [#fallback-output text: "TODO: No response" idx]
~~~`);
