instance LexActionsEng of LexActions = open SyntaxEng, ParadigmsEng in {
  oper
    buy_V2 = mkV2 (mkV "buy") ;
    sell_V2 = mkV2 (mkV "sell") ;

    borrow_V2 = mkV2 (mkV "borrow") ;
    pay_back_V2 = mkV2 (partV (mkV "pay") "back") ;
}
