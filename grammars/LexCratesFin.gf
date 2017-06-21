instance LexCratesFin of LexCrates =
  open
    SyntaxFin,
    ParadigmsFin
  in {
  oper
    crateof_CN2CN = \comm -> mkCN (mkN2 (mkN "korilinen") (casePrep partitive)) (mkNP comm);

    {- TODO autogenerate items -}
    wine_N = mkN "viini" ;
    cheese_N = mkN "juusto" ;
    fish_N = mkN "kala" ;

    {- XXX WRONG -}
    at_Prep = mkPrep "XatX" ;
    each_Adv = ParadigmsFin.mkAdv "kukin" ;
    euro_N = mkN "euro" ;
}
