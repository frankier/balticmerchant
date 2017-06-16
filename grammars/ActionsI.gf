incomplete concrete ActionsI of Actions = CratesI **
  open
    Syntax,
    LexActions
  in {
  lincat
    CommandUtt = Utt ;
    Command = Imp ;
    ExchangeV2 = V2 ;
    DebtV2 = V2 ;
  lin
    ActionUtt c = mkUtt c ;

    ExchangeAction v cq = mkImp v cq ;
    Buy = buy_V2 ;
    Sell = sell_V2 ;

    DebtAction v m = mkImp v m;
    Borrow = borrow_V2 ;
    PayBack = pay_back_V2 ;
}
