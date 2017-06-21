incomplete concrete ActionsI of Actions = CratesI **
  open
    Syntax,
    Extra,
    LexActions
  in {
  lincat
    CommandUtt = Utt ;
    Command = Imp ;
    ExchangeV2 = V2 ;
    DebtV2 = V2 ;
    City = NP ;

    Description = S;
  lin
    ActionUtt c = mkUtt c ;

    GeneralExchangeAction v cq = mkImp v cq ;
    SpecificExchangeAction v o = mkImp v o;
    Buy = buy_V2 ;
    Sell = sell_V2 ;

    DebtAction v m = mkImp v m;
    Borrow = borrow_V2 ;
    PayBack = pay_back_V2 ;

    LookAction = mkImp look_V ;
    CheckMoney = mkImp check_V2 money_NP ;
    CheckInventory = mkImp check_V2 inventory_NP ;

    JetAction loc = mkImp (mkVP (mkVP sail_V) (mkAdv to_Prep loc));
    London = mkNP London_PN;
    Helsinki = mkNP Helsinki_PN;
    Stockholm = mkNP Stockholm_PN;

    LookAround offer = PredVPS you_NP (ConjVPS and_Conj (BaseVPS (mkSimpleVPS (mkVP look_around_V)) (mkSimpleVPS (mkVP see_V2 offer)))) ;
    Arrive loc = mkS (mkCl you_NP (mkVP (mkVP arrive_V) (mkAdv in_Prep loc))) ;
  oper
    presim : Temp = mkTemp presentTense simultaneousAnt ;
    mkSimpleVPS : VP -> VPS = \vp -> MkVPS presim positivePol vp ;
}
