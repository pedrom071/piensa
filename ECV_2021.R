#ECV 2021 P!ensa

library(haven)
ECV_021 <- read_dta("Pedro/UC/COMERCIAL/Práctica/P!ensa/Investigación/ECV/BBDD/+ponderadores/BBDD - Calidad de Vida 2021 - Fundación Piensa.dta")
ECV_021 = ECV_021[-12]

library(dplyr)
library(tidyverse)
library(datasets)

#Total de Datos
n = count(ECV_021)
n

#Variables Demográficas

#sexo
hombre = filter(ECV_021, A5==1)
s.hombre = select(hombre, PONDERAD)
mujer = filter(ECV_021, A5==2)
s.mujer = select(mujer, PONDERAD)
p_hombre = sum(s.hombre)/(sum(s.hombre)+sum(s.mujer))
p_hombre
p_mujer = sum(s.mujer)/(sum(s.hombre)+sum(s.mujer))
p_mujer

#edad
r1 = filter (ECV_021, A4>=18 & A4<=25)
s.r1 = select (r1, PONDERAD)
p_r1 = sum(s.r1)/n
p_r1
r2 = filter (ECV_021, A4>=26 & A4<=40)
s.r2 = select (r2, PONDERAD)
p_r2 = sum(s.r2)/n
p_r2
r3 = filter (ECV_021, A4>=41 & A4<=59)
s.r3 = select (r3, PONDERAD)
p_r3 = sum(s.r3)/n
p_r3
r4 = filter (ECV_021, A4>=60)
s.r4 = select (r4, PONDERAD)
p_r4 = sum(s.r4)/n
p_r4

#estado civil
ec.nr = filter (ECV_021, Z8==99)
soltero = filter (ECV_021, Z8==1)
s.soltero = select (soltero, PONDERAD)
p_soltero = sum(s.soltero)/n
p_soltero
casado = filter (ECV_021, Z8==2)
s.casado = select (casado, PONDERAD)
p_casado = sum(s.casado)/n
p_casado
conviviente = filter (ECV_021, Z8==3 | Z8==4)
s.conviviente = select (conviviente, PONDERAD)
p_conviviente= sum(s.conviviente)/n
p_conviviente
viudo = filter (ECV_021, Z8==5)
s.viudo = select(viudo, PONDERAD)
p_viudo = sum(s.viudo)/n
p_viudo
divorciado = filter (ECV_021, Z8==6)
s.divorciado = select (divorciado, PONDERAD)
p_divorciado = sum(s.divorciado)/n
p_divorciado

#rol en el hogar
rol.nr = filter (ECV_021, Z1==99 | is.na(Z1))
s.rol.nr = select(rol.nr, PONDERAD)
rol_nr = sum(s.rol.nr)
jefe = filter (ECV_021, Z1==1)
s.jefe = select(jefe, PONDERAD)
p_jefe = sum(s.jefe)/(n-rol_nr)
p_jefe
conyuge = filter (ECV_021, Z1==2)
s.conyuge = select(conyuge, PONDERAD)
p_conyuge = sum(s.conyuge)/(n-rol_nr)
p_conyuge
hijo = filter (ECV_021, Z1==3)
s.hijo = select(hijo, PONDERAD)
p_hijo = sum(s.hijo)/(n-rol_nr)
p_hijo
otro.rol = filter (ECV_021, Z1==4)
s.otro.rol = select(otro.rol, PONDERAD)
p_otro_rol = sum(s.otro.rol)/(n-rol_nr)
p_otro_rol

#actividad
act.nr = filter (ECV_021, Z4==99| is.na(Z4))
s.act.nr = select(act.nr, PONDERAD)
act_nr = sum(s.act.nr)
trabaja = filter(ECV_021, Z4<=6 | Z7==1)
s.trabaja = select(trabaja, PONDERAD)
p_trabaja = sum(s.trabaja)/(n-act_nr)
p_trabaja
estudia = filter(ECV_021, Z4==7 & Z7==2)
s.estudia = select(estudia, PONDERAD)
p_estudia = sum(s.estudia)/(n-act_nr)
p_estudia
lab.hogar = filter(ECV_021, Z4==7 & Z7==3)
s.lab.hogar = select(lab.hogar, PONDERAD)
p_lab_hogar = sum(s.lab.hogar)/(n-act_nr)
p_lab_hogar
busca.trab= filter(ECV_021, Z4==7 & Z7==4)
s.busca.trab = select(busca.trab, PONDERAD)
p_busca_trab = sum(s.busca.trab)/(n-act_nr)
p_busca_trab
jubilado = filter(ECV_021, Z4==7 & Z7==5)
s.jubilado = select(jubilado, PONDERAD)
p_jubilado = sum(s.jubilado)/(n-act_nr)
p_jubilado
otro.act = filter(ECV_021, Z4==7 & Z7==6)
s.otro.act = select(otro.act, PONDERAD)
p_otro_act = sum(s.otro.act)/(n-act_nr)
p_otro_act

#nivel de enseñanza
educ.nr = filter(ECV_021, Z2==99 | is.na(Z2))
s.educ.nr = select(educ.nr, PONDERAD)
educ_nr = sum(s.educ.nr)
basica = filter(ECV_021, Z2<=2)
s.basica = select(basica, PONDERAD)
p_basica = sum(s.basica)/(n-educ_nr)
p_basica
secund = filter(ECV_021, Z2==3 | Z2==4 | Z2==5)
s.secund = select(secund, PONDERAD)
p_secund = sum(s.secund)/(n-educ_nr)
p_secund
superior = filter(ECV_021, Z2>=6 & Z2!=99)
s.superior = select(superior, PONDERAD)
p_superior = sum(s.superior)/(n-educ_nr)
p_superior


#nivel socioeconómico
ing.nr = filter(ECV_021, E4==99 | is.na(E4))
s.ing.nr = select(ing.nr, PONDERAD)
ing_nr = sum(s.ing.nr)
abc1 = filter(ECV_021, E4==1 | E4==2)
s.abc1 = select(abc1, PONDERAD)
p_abc1 = sum(s.abc1)/(n-ing_nr)
p_abc1

c1 = filter(ECV_021, E4==3)
s.c1 = select(c1, PONDERAD)
p_c1 = sum(s.c1)/(n-ing_nr)
p_c1

#Indice de Percepción de Calidad de Vida

#Región de Valparaíso
#servicios para la vivienda
basura.nr = filter(ECV_021, is.na(B1_1))
viv.bas = filter(ECV_021, B1_1>=6)
s.viv.bas = select(viv.bas, PONDERAD)
p_bas_viv = sum(s.viv.bas)/n
viv_1 =p_bas_viv*100

agua.nr = filter(ECV_021, is.na(B1_2))
viv.agua = filter(ECV_021, B1_2>=6)
s.viv.agua = select(viv.agua, PONDERAD)
p_agua_viv = sum(s.viv.agua)/n
viv_2 =p_agua_viv*100

alcant.nr = filter(ECV_021, is.na(B1_3))
viv.alcant = filter(ECV_021, B1_3>=6)
s.viv.alcant = select(viv.alcant, PONDERAD)
p_alcant_viv = sum(s.viv.alcant)/n
viv_3 =p_alcant_viv*100

elect.nr = filter(ECV_021, is.na(B1_4))
viv.elect = filter(ECV_021, B1_4>=6)
s.viv.elect = select(viv.elect, PONDERAD)
p_elect_viv = sum(s.viv.elect)/n
viv_4 =p_elect_viv*100

ind_viv = (viv_1+viv_2+viv_3+viv_4)*1000/400

#servicios de salud

s1.nr = filter(ECV_021, is.na(B4_1) | B4_1==99)
s.s1.nr = select(s1.nr, PONDERAD)
nr_s1 = sum(s.s1.nr)
s1 = filter(ECV_021, B4_1>=6 & B4_1!=99)
s.s1 = select(s1, PONDERAD)
p_s1 = sum(s.s1)/(n-nr_s1)
sal_1 = p_s1*100

s2.nr = filter(ECV_021, is.na(B4_2) | B4_2==99)
s.s2.nr = select(s2.nr, PONDERAD)
nr_s2 = sum(s.s2.nr)
s2 = filter(ECV_021, B4_2>=6  & B4_2!=99)
s.s2 = select(s2, PONDERAD)
p_s2 = sum(s.s2)/(n-nr_s2)
sal_2 = p_s2*100

s3.nr = filter(ECV_021, is.na(B4_3) | B4_3==99)
s.s3.nr = select(s3.nr, PONDERAD)
nr_s3 = sum(s.s3.nr)
s3 = filter(ECV_021, B4_3>=6 & B4_3!=99)
s.s3 = select(s3, PONDERAD)
p_s3 = sum(s.s3)/(n-nr_s3)
sal_3 = p_s3*100

s4.nr = filter(ECV_021, is.na(B4_4) | B4_4==99)
s.s4.nr = select(s4.nr, PONDERAD)
nr_s4 = sum(s.s4.nr)
s4 = filter(ECV_021, B4_4>=6  & B4_4!=99)
s.s4 = select(s4, PONDERAD)
p_s4 = sum(s.s4)/(n-nr_s4)
sal_4 = p_s4*100

s5.nr = filter(ECV_021, is.na(B4_5) | B4_5==99)
s.s5.nr = select(s5.nr, PONDERAD)
nr_s5 = sum(s.s5.nr)
s5 = filter(ECV_021, B4_5>=6 & B4_5!=99)
s.s5 = select(s5, PONDERAD)
p_s5 = sum(s.s5)/(n-nr_s5)
sal_5 = p_s5*100

s6.nr = filter(ECV_021, is.na(B4_6) | B4_6==99)
s.s6.nr = select(s6.nr, PONDERAD)
nr_s6 = sum(s.s6.nr)
s6 = filter(ECV_021, B4_6>=6 & B4_6!=99)
s.s6 = select(s6, PONDERAD)
p_s6 = sum(s.s6)/(n-nr_s6)
sal_6 = p_s6*100

s7.nr = filter(ECV_021, is.na(B4_7) | B4_7==99)
s.s7.nr = select(s7.nr, PONDERAD)
nr_s7 = sum(s.s7.nr)
s7 = filter(ECV_021, B4_7>=6 & B4_7!=99)
s.s7 = select(s7, PONDERAD)
p_s7 = sum(s.s7)/(n-nr_s7)
sal_7 = p_s7*100

s8.nr = filter(ECV_021, is.na(B4_8) | B4_8==99)
s.s8.nr = select(s8.nr, PONDERAD)
nr_s8 = sum(s.s8.nr)
s8 = filter(ECV_021, B4_8>=6 & B4_8!=99)
s.s8 = select(s8, PONDERAD)
p_s8 = sum(s.s8)/(n-nr_s8)
sal_8 = p_s8*100

s9.nr = filter(ECV_021, is.na(B4_9) | B4_9==99)
s.s9.nr = select(s9.nr, PONDERAD)
nr_s9 = sum(s.s9.nr)
s9 = filter(ECV_021, B4_9>=6 & B4_9!=99)
s.s9 = select(s9, PONDERAD)
p_s9 = sum(s.s9)/(n-nr_s9)
sal_9 = p_s9*100

s10.nr = filter(ECV_021, is.na(B4_10) | B4_10==99)
s.s10.nr = select(s10.nr, PONDERAD)
nr_s10 = sum(s.s10.nr)
s10 = filter(ECV_021, B4_10>=6 & B4_10!=99)
s.s10 = select(s10, PONDERAD)
p_s10 = sum(s.s10)/(n-nr_s10)
sal_10 = p_s10*100

s11.nr = filter(ECV_021, is.na(B4_11) | B4_11==99)
s.s11.nr = select(s11.nr, PONDERAD)
nr_s11 = sum(s.s11.nr)
s11 = filter(ECV_021, B4_11>=6 & B4_11!=99)
s.s11 = select(s11, PONDERAD)
p_s11 = sum(s.s11)/(n-nr_s11)
sal_11 = p_s11*100

s12.nr = filter(ECV_021, is.na(B4_12) | B4_12==99)
s.s12.nr = select(s12.nr, PONDERAD)
nr_s12 = sum(s.s12.nr)
s12 = filter(ECV_021, B4_12>=6 & B4_12!=99)
s.s12 = select(s12, PONDERAD)
p_s12 = sum(s.s12)/(n-nr_s12)
sal_12 = p_s12*100

ind_sal = (sal_1+sal_2+sal_3+sal_4+sal_5+sal_6+sal_7+sal_8+sal_9+sal_10+sal_11+sal_12)*1000/1200

#servicios de edcuación

e1.nr = filter(ECV_021, is.na(B10_1) | B10_1==99)
s.e1.nr = select(e1.nr, PONDERAD)
nr_e1 = sum(s.e1.nr)
e1 = filter(ECV_021, B10_1>=6 & B10_1!=99)
s.e1 = select(e1, PONDERAD)
p_e1 = sum(s.e1)/(n-nr_e1)
educ_1 = p_e1*100

e2.nr = filter(ECV_021, is.na(B10_2) | B10_2==99)
s.e2.nr = select(e2.nr, PONDERAD)
nr_e2 = sum(s.e2.nr)
e2 = filter(ECV_021, B10_2>=6 & B10_2!=99)
s.e2 = select(e2, PONDERAD)
p_e2 = sum(s.e2)/(n-nr_e2)
educ_2 = p_e2*100

e3.nr = filter(ECV_021, is.na(B10_3) | B10_3==99)
s.e3.nr = select(e3.nr, PONDERAD)
nr_e3 = sum(s.e3.nr)
e3 = filter(ECV_021, B10_3>=6 & B10_3!=99)
s.e3 = select(e3, PONDERAD)
p_e3 = sum(s.e3)/(n-nr_e3)
educ_3 = p_e3*100

e4.nr = filter(ECV_021, is.na(B10_4) | B10_4==99)
s.e4.nr = select(e4.nr, PONDERAD)
nr_e4 = sum(s.e4.nr)
e4 = filter(ECV_021, B10_4>=6 & B10_4!=99)
s.e4 = select(e4, PONDERAD)
p_e4 = sum(s.e4)/(n-nr_e4)
educ_4 = p_e4*100

e5.nr = filter(ECV_021, is.na(B10_5) | B10_5==99)
s.e5.nr = select(e5.nr, PONDERAD)
nr_e5 = sum(s.e5.nr)
e5 = filter(ECV_021, B10_5>=6 & B10_5!=99)
s.e5 = select(e5, PONDERAD)
p_e5 = sum(s.e5)/(n-nr_e5)
educ_5 = p_e5*100

e6.nr = filter(ECV_021, is.na(B10_6) | B10_6==99)
s.e6.nr = select(e6.nr, PONDERAD)
nr_e6 = sum(s.e6.nr)
e6 = filter(ECV_021, B10_6>=6 & B10_6!=99)
s.e6 = select(e6, PONDERAD)
p_e6 = sum(s.e6)/(n-nr_e6)
educ_6 = p_e6*100

e7.nr = filter(ECV_021, is.na(B10_7) | B10_7==99)
s.e7.nr = select(e7.nr, PONDERAD)
nr_e7 = sum(s.e7.nr)
e7 = filter(ECV_021, B10_7>=6 & B10_7!=99)
s.e7 = select(e7, PONDERAD)
p_e7 = sum(s.e7)/(n-nr_e7)
educ_7 = p_e7*100

e8.nr = filter(ECV_021, is.na(B10_8) | B10_8==99)
s.e8.nr = select(e8.nr, PONDERAD)
nr_e8 = sum(s.e8.nr)
e8 = filter(ECV_021, B10_8>=6 & B10_8!=99)
s.e8 = select(e8, PONDERAD)
p_e8 = sum(s.e8)/(n-nr_e8)
educ_8 = p_e8*100

ind_educ = (educ_1+educ_2+educ_3+educ_4+educ_5+educ_6+educ_7+educ_8)*1000/800

#seguridad
seg1.nr = filter(ECV_021, is.na(B11_1) | B11_1==98 | B11_1==99)
s.seg1.nr = select(seg1.nr, PONDERAD)
nr_seg1 = sum(s.seg1.nr)
seg1 = filter(ECV_021, B11_1>=6 & B11_1!=99 & B11_1!=98)
s.seg1 = select(seg1, PONDERAD)
p_seg1 = sum(s.seg1)/(n-nr_seg1)
seg_1 = p_seg1*100

seg2.nr = filter(ECV_021, is.na(B11_2) | B11_2==98 | B11_2==99)
s.seg2.nr = select(seg2.nr, PONDERAD)
nr_seg2 = sum(s.seg2.nr)
seg2 = filter(ECV_021, B11_2>=6 & B11_2!=99 & B11_2!=98)
s.seg2 = select(seg2, PONDERAD)
p_seg2 = sum(s.seg2)/(n-nr_seg2)
seg_2 = p_seg2*100
#nos saltamos a nivel país B11_3
seg4.nr = filter(ECV_021, is.na(B11_4) | B11_4==98 | B11_4==99)
s.seg4.nr = select(seg4.nr, PONDERAD)
nr_seg4 = sum(s.seg4.nr)
seg4 = filter(ECV_021, B11_4>=6 & B11_4!=99 & B11_4!=98)
s.seg4 = select(seg4, PONDERAD)
p_seg4 = sum(s.seg4)/(n-nr_seg4)
seg_4 = p_seg4*100

seg5.nr = filter(ECV_021, is.na(B11_5) | B11_5==98 | B11_5==99)
s.seg5.nr = select(seg5.nr, PONDERAD)
nr_seg5 = sum(s.seg5.nr)
seg5 = filter(ECV_021, B11_5>=6 & B11_5!=99 & B11_5!=98)
s.seg5 = select(seg5, PONDERAD)
p_seg5 = sum(s.seg5)/(n-nr_seg5)
seg_5 = p_seg5*100

seg6.nr = filter(ECV_021, is.na(B11_6) | B11_6==98 | B11_6==99)
s.seg6.nr = select(seg6.nr, PONDERAD)
nr_seg6 = sum(s.seg6.nr)
seg6 = filter(ECV_021, B11_6>=6 & B11_6!=99 & B11_6!=98)
s.seg6 = select(seg6, PONDERAD)
p_seg6 = sum(s.seg6)/(n-nr_seg6)
seg_6 = p_seg6*100

seg7.nr = filter(ECV_021, is.na(B11_7) | B11_7==98 | B11_7==99)
s.seg7.nr = select(seg7.nr, PONDERAD)
nr_seg7 = sum(s.seg7.nr)
seg7 = filter(ECV_021, B11_7>=6 & B11_7!=99 & B11_7!=98)
s.seg7 = select(seg7, PONDERAD)
p_seg7 = sum(s.seg7)/(n-nr_seg7)
seg_7 = p_seg7*100

seg8.nr = filter(ECV_021, is.na(B11_8) | B11_8==98 | B11_8==99)
s.seg8.nr = select(seg8.nr, PONDERAD)
nr_seg8 = sum(s.seg8.nr)
seg8 = filter(ECV_021, B11_8>=6 & B11_8!=99 & B11_8!=98)
s.seg8 = select(seg8, PONDERAD)
p_seg8 = sum(s.seg8)/(n-nr_seg8)
seg_8 = p_seg8*100

seg9.nr = filter(ECV_021, is.na(B11_9) | B11_9==98 | B11_9==99)
s.seg9.nr = select(seg9.nr, PONDERAD)
nr_seg9 = sum(s.seg9.nr)
seg9 = filter(ECV_021, B11_9>=6 & B11_9!=99 & B11_9!=98)
s.seg9 = select(seg9, PONDERAD)
p_seg9 = sum(s.seg9)/(n-nr_seg9)
seg_9 = p_seg9*100

seg10.nr = filter(ECV_021, is.na(B11_10) | B11_10==98 | B11_10==99)
s.seg10.nr = select(seg10.nr, PONDERAD)
nr_seg10 = sum(s.seg10.nr)
seg10 = filter(ECV_021, B11_10>=6 & B11_10!=99 & B11_10!=98)
s.seg10 = select(seg10, PONDERAD)
p_seg10 = sum(s.seg10)/(n-nr_seg10)
seg_10 = p_seg10*100

seg11.nr = filter(ECV_021, is.na(B11_11) | B11_11==98 | B11_11==99)
s.seg11.nr = select(seg11.nr, PONDERAD)
nr_seg11 = sum(s.seg11.nr)
seg11 = filter(ECV_021, B11_11>=6 & B11_11!=99 & B11_11!=98)
s.seg11 = select(seg11, PONDERAD)
p_seg11 = sum(s.seg11)/(n-nr_seg11)
seg_11 = p_seg11*100

seg12.nr = filter(ECV_021, is.na(B11_12) | B11_12==98 | B11_12==99)
s.seg12.nr = select(seg12.nr, PONDERAD)
nr_seg12 = sum(s.seg12.nr)
seg12 = filter(ECV_021, B11_12>=6 & B11_12!=99 & B11_12!=98)
s.seg12 = select(seg12, PONDERAD)
p_seg12 = sum(s.seg12)/(n-nr_seg12)
seg_12 = p_seg12*100

seg13.nr = filter(ECV_021, is.na(B11_13) | B11_13==98 | B11_13==99)
s.seg13.nr = select(seg13.nr, PONDERAD)
nr_seg13 = sum(s.seg13.nr)
seg13 = filter(ECV_021, B11_13>=6 & B11_13!=99 & B11_13!=98)
s.seg13 = select(seg13, PONDERAD)
p_seg13 = sum(s.seg13)/(n-nr_seg13)
seg_13 = p_seg13*100

seg14.nr = filter(ECV_021, is.na(B11_14) | B11_14==98 | B11_14==99)
s.seg14.nr = select(seg14.nr, PONDERAD)
nr_seg14 = sum(s.seg14.nr)
seg14 = filter(ECV_021, B11_14>=6 & B11_14!=99 & B11_14!=98)
s.seg14 = select(seg14, PONDERAD)
p_seg14 = sum(s.seg14)/(n-nr_seg14)
seg_14 = p_seg14*100

seg15.nr = filter(ECV_021, is.na(B11_15) | B11_15==98 | B11_15==99)
s.seg15.nr = select(seg15.nr, PONDERAD)
nr_seg15 = sum(s.seg15.nr)
seg15 = filter(ECV_021, B11_15>=6 & B11_15!=99 & B11_15!=98)
s.seg15 = select(seg15, PONDERAD)
p_seg15 = sum(s.seg15)/(n-nr_seg15)
seg_15 = p_seg15*100

seg16.nr = filter(ECV_021, is.na(B11_16) | B11_16==98 | B11_16==99)
s.seg16.nr = select(seg16.nr, PONDERAD)
nr_seg16 = sum(s.seg16.nr)
seg16 = filter(ECV_021, B11_16>=6 & B11_16!=99 & B11_16!=98)
s.seg16 = select(seg16, PONDERAD)
p_seg16 = sum(s.seg16)/(n-nr_seg16)
seg_16 = p_seg16*100

ind_seg = (seg_1+seg_2+seg_4+seg_5+seg_6
           +seg_7+seg_8+seg_9+seg_10+seg_11
           +seg_12+seg_13+seg_14+seg_15+seg_16)*1000/1500

#sugerencias para mejorar la seguridad de los barrios
