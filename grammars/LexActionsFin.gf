instance LexActionsFin of LexActions = open SyntaxFin, ParadigmsFin in {
  oper
    buy_V2 = mkV2 (mkV "ostaa") ;
    sell_V2 = mkV2 (mkV "myydä") ;

    borrow_V2 = mkV2 (mkV "lainata") ;
    pay_back_V2 = mkV2 (mkV "maksaa") (postPrep nominative "takaisin") ;
}
