instance LexActionsEng of LexActions = open SyntaxEng, ParadigmsEng in {
  oper
    buy_V2 = mkV2 (mkV "buy") ;
    sell_V2 = mkV2 (mkV "sell") ;

    borrow_V2 = mkV2 (mkV "borrow") ;
    pay_back_V2 = mkV2 (partV (mkV "pay") "back") ;

    sail_V = mkV "sail" ;
    London_PN = mkPN "London" ;
    Helsinki_PN = mkPN "Helsinki" ;
    Stockholm_PN = mkPN "Stockholm" ;

    look_V = mkV "look" ;
    check_V2 = mkV2 "check" ;
    money_NP = mkNP (mkN "money") ;
    inventory_NP = mkNP (mkN "inventory") ;

    look_around_V = partV (mkV "look") "around" ;
    see_V2 = mkV2 (mkV "see") ;
    arrive_V = mkV "arrive" ;
}
