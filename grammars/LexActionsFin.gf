instance LexActionsFin of LexActions = open Kotus, SyntaxFin, ParadigmsFin, DictFin in {
  oper
    buy_V2 = mkV2 (mkV "ostaa") ;
    sell_V2 = mkV2 (mkV "myydä") ;

    borrow_V2 = mkV2 (mkV "lainata") ;
    pay_back_V2 = mkV2 (mkV "maksaa") (postPrep nominative "takaisin") ;

    --sail_V = mkV "purjehtia" ;
    sail_V = mkV purjehtia_VK ;
    London_PN = mkPN (NK {s = d17 "Lontoo"}) ;
    Helsinki_PN = mkPN "Helsinki" ;
    Stockholm_PN = mkPN "Tukholma" ;

    look_V = mkV "katsoa" ;
    check_V2 = mkV2 "tarkistaa" ;
    money_NP = mkNP (mkN "raha") ;
    inventory_NP = mkNP (mkN "inventaario") ;

    -- XXX: si/ni doesn't change for person correctly here
    look_around_V = mkV (mkV "katsoa") "ymärillesi" ;
    see_V2 = mkV2 (mkV "nähdä") ;
    arrive_V = mkV "saapua" ;
}
