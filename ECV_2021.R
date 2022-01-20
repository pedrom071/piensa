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

#en primer lugar

op1.nr = filter(ECV_021, is.na(B12_1) | B12_1==98 | B12_1==99)
s.op1.nr = select(op1.nr, PONDERAD)
nr_op1 = sum((s.op1.nr))
sug_op1 = c()

for (i in (1:13)) {
  sug = filter(ECV_021, B12_1==i)
  s.sug = select(sug, PONDERAD)
  p_sug = (sum(s.sug)/(n-nr_op1))*100
  sug_op1 = rbind(sug_op1, p_sug)
  
}

#en total

op2.nr = filter(ECV_021, (B12_1!=98 & B12_1!=99) & (is.na(B12_2)  
                  | B12_2==98 | B12_2==99))
s.op2.nr = select(op2.nr, PONDERAD)
nr_op2 = sum((s.op2.nr))
op3.nr = filter(ECV_021, (B12_1!=98 & B12_1!=99) & 
                  (B12_2!=98 & B12_2!=99) & 
                (is.na(B12_3) | B12_3==98 | B12_3==99))
s.op3.nr = select(op3.nr, PONDERAD)
nr_op3 = sum((s.op3.nr))

sug_total = c()

for (i in (1:13)) {
  sug1 = filter(ECV_021, B12_1==i)
  s.sug1 = select(sug1, PONDERAD)
  p_sug1 = (sum(s.sug1)/(n))*100
  sug2 = filter(ECV_021, B12_2==i)
  s.sug2 = select(sug2, PONDERAD)
  p_sug2 = (sum(s.sug2)/(n))*100
  sug3 = filter(ECV_021, B12_3==i)
  s.sug3 = select(sug3, PONDERAD)
  p_sug3 = (sum(s.sug3)/(n))*100
  tot_sug = p_sug1+p_sug2+p_sug3
  
  sug_total = rbind(sug_total, tot_sug)
  
}

#medidas tomadas para seguridad

med.1 = filter(ECV_021, B13_1>=1)
s.med.1 = select(med.1, PONDERAD)
s.med.1 = rbind(s.med.1, 0)
p_med1 = (sum(s.med.1))/(n)*100

med.2 = filter(ECV_021, B13_2>=1)
s.med.2 = select(med.2, PONDERAD)
s.med.2 = rbind(s.med.2, 0)
p_med2 = (sum(s.med.2))/(n)*100

med.3 = filter(ECV_021, B13_3>=1)
s.med.3 = select(med.3, PONDERAD)
s.med.3 = rbind(s.med.3, 0)
p_med3 = (sum(s.med.3))/(n)*100

med.4 = filter(ECV_021, B13_4>=1)
s.med.4 = select(med.4, PONDERAD)
s.med.4 = rbind(s.med.4, 0)
p_med4 = (sum(s.med.4))/(n)*100
  
med.5 = filter(ECV_021, B13_5>=1)
s.med.5 = select(med.5, PONDERAD)
s.med.5 = rbind(s.med.5, 0)
p_med5 = (sum(s.med.5))/(n)*100

med.6 = filter(ECV_021, B13_6>=1)
s.med.6 = select(med.6, PONDERAD)
s.med.6 = rbind(s.med.6, 0)
p_med6 = (sum(s.med.6))/(n)*100

med.7 = filter(ECV_021, B13_7>=1)
s.med.7 = select(med.7, PONDERAD)
s.med.7 = rbind(s.med.7, 0)
p_med7 = (sum(s.med.7))/(n)*100

med.8 = filter(ECV_021, B13_8>=1)
s.med.8 = select(med.8, PONDERAD)
s.med.8 = rbind(s.med.8, 0)
p_med8 = (sum(s.med.8))/(n)*100

med.9 = filter(ECV_021, B13_9>=1)
s.med.9 = select(med.9, PONDERAD)
s.med.9 = rbind(s.med.9, 0)
p_med9 = (sum(s.med.9))/(n)*100

med.10 = filter(ECV_021, B13_10>=1)
s.med.10 = select(med.10, PONDERAD)
s.med.10 = rbind(s.med.10, 0)
p_med10 = (sum(s.med.10))/(n)*100

#incivilidades

#trabajo

trab1.nr = filter(ECV_021, is.na(E2_1) | E2_1==99)
s.trab1.nr = select(trab1.nr, PONDERAD)
nr_trab1 = sum(s.trab1.nr)
trab1 = filter(ECV_021, E2_1==4 | E2_1==5)
s.trab1 = select(trab1, PONDERAD)
p_trab1 = sum(s.trab1)/(n-nr_trab1)
trab_1 = p_trab1*100

trab2.nr = filter(ECV_021, is.na(E2_2) | E2_2==99)
s.trab2.nr = select(trab2.nr, PONDERAD)
nr_trab2 = sum(s.trab2.nr)
trab2 = filter(ECV_021, E2_2==4 | E2_2==5)
s.trab2 = select(trab2, PONDERAD)
p_trab2 = sum(s.trab2)/(n-nr_trab2)
trab_2 = p_trab2*100

trab3.nr = filter(ECV_021, is.na(E2_3) | E2_3==99)
s.trab3.nr = select(trab3.nr, PONDERAD)
nr_trab3 = sum(s.trab3.nr)
trab3 = filter(ECV_021, E2_3==4 | E2_3==5)
s.trab3 = select(trab3, PONDERAD)
p_trab3 = sum(s.trab3)/(n-nr_trab3)
trab_3 = p_trab3*100

trab4.nr = filter(ECV_021, is.na(E2_4) | E2_4==99)
s.trab4.nr = select(trab4.nr, PONDERAD)
nr_trab4 = sum(s.trab4.nr)
trab4 = filter(ECV_021, E2_4==4 | E2_4==5)
s.trab4 = select(trab4, PONDERAD)
p_trab4 = sum(s.trab4)/(n-nr_trab4)
trab_4 = p_trab4*100

trab5.nr = filter(ECV_021, is.na(E2_5) | E2_5==99)
s.trab5.nr = select(trab5.nr, PONDERAD)
nr_trab5 = sum(s.trab5.nr)
trab5 = filter(ECV_021, E2_5==4 | E2_5==5)
s.trab5 = select(trab5, PONDERAD)
p_trab5 = sum(s.trab5)/(n-nr_trab5)
trab_5 = p_trab5*100

trab6.nr = filter(ECV_021, is.na(E2_6) | E2_6==99)
s.trab6.nr = select(trab6.nr, PONDERAD)
nr_trab6 = sum(s.trab6.nr)
trab6 = filter(ECV_021, E2_6==4 | E2_6==5)
s.trab6 = select(trab6, PONDERAD)
p_trab6 = sum(s.trab6)/(n-nr_trab6)
trab_6 = p_trab6*100

trab7.nr = filter(ECV_021, is.na(E2_7) | E2_7==99)
s.trab7.nr = select(trab7.nr, PONDERAD)
nr_trab7 = sum(s.trab7.nr)
trab7 = filter(ECV_021, E2_7==4 | E2_7==5)
s.trab7 = select(trab7, PONDERAD)
p_trab7 = sum(s.trab7)/(n-nr_trab7)
trab_7 = p_trab7*100

ind_trab = (trab_1+trab_2+trab_3+trab_4+trab_5+
             trab_6+trab_7)*1000/700

#ingreso familiar

#¿les alcanza?

na.e4 = filter(ECV_021, is.na(E4)) #cero na
ing_alc = c()

for (i in (1:5)) {
  alc = filter(ECV_021, E4==i)
  s.alc = select(alc, PONDERAD)
  p_alc = sum(s.alc)/n*100
  ing_alc = rbind(ing_alc, p_alc)
  
}

nr = 100-sum(ing_alc)

#equipamiento urbano

urb1.nr = filter(ECV_021, is.na(C1_1) | C1_1==99)
s.urb1.nr = select(urb1.nr, PONDERAD)
s.urb1.nr = rbind(s.urb1.nr, 0)
nr_urb1 = sum(s.urb1.nr)
urb1 = filter(ECV_021, C1_1==6 | C1_1==7)
s.urb1 = select(urb1, PONDERAD)
p_urb1 = sum(s.urb1)/(n-nr_urb1)
urb1 = p_urb1*100

urb2.nr = filter(ECV_021, is.na(C1_2) | C1_2==99)
s.urb2.nr = select(urb2.nr, PONDERAD)
s.urb2.nr = rbind(s.urb2.nr, 0)
nr_urb2 = sum(s.urb2.nr)
urb2 = filter(ECV_021, C1_2==6 | C1_2==7)
s.urb2 = select(urb2, PONDERAD)
p_urb2 = sum(s.urb2)/(n-nr_urb2)
urb2 = p_urb2*100

urb3.nr = filter(ECV_021, is.na(C1_3) | C1_3==99)
s.urb3.nr = select(urb3.nr, PONDERAD)
s.urb3.nr = rbind(s.urb3.nr, 0)
nr_urb3 = sum(s.urb3.nr)
urb3 = filter(ECV_021, C1_3==6 | C1_3==7)
s.urb3 = select(urb3, PONDERAD)
p_urb3 = sum(s.urb3)/(n-nr_urb3)
urb3 = p_urb3*100

urb4.nr = filter(ECV_021, is.na(C1_4) | C1_4==99)
s.urb4.nr = select(urb4.nr, PONDERAD)
s.urb4.nr = rbind(s.urb4.nr, 0)
nr_urb4 = sum(s.urb4.nr)
urb4 = filter(ECV_021, C1_4==6 | C1_4==7)
s.urb4 = select(urb4, PONDERAD)
p_urb4 = sum(s.urb4)/(n-nr_urb4)
urb4 = p_urb4*100

urb5.nr = filter(ECV_021, is.na(C1_5) | C1_5==99)
s.urb5.nr = select(urb5.nr, PONDERAD)
s.urb5.nr = rbind(s.urb5.nr, 0)
nr_urb5 = sum(s.urb5.nr)
urb5 = filter(ECV_021, C1_5==6 | C1_5==7)
s.urb5 = select(urb5, PONDERAD)
p_urb5 = sum(s.urb5)/(n-nr_urb5)
urb5 = p_urb5*100

urb6.nr = filter(ECV_021, is.na(C1_6) | C1_6==99)
s.urb6.nr = select(urb6.nr, PONDERAD)
s.urb6.nr = rbind(s.urb6.nr, 0)
nr_urb6 = sum(s.urb6.nr)
urb6 = filter(ECV_021, C1_6==6 | C1_6==7)
s.urb6 = select(urb6, PONDERAD)
p_urb6 = sum(s.urb6)/(n-nr_urb6)
urb6 = p_urb6*100

urb7.nr = filter(ECV_021, is.na(C1_7) | C1_7==99)
s.urb7.nr = select(urb7.nr, PONDERAD)
s.urb7.nr = rbind(s.urb7.nr, 0)
nr_urb7 = sum(s.urb7.nr)
urb7 = filter(ECV_021, C1_7==6 | C1_7==7)
s.urb7 = select(urb7, PONDERAD)
p_urb7 = sum(s.urb7)/(n-nr_urb7)
urb7 = p_urb7*100

urb8.nr = filter(ECV_021, is.na(C1_8) | C1_8==99)
s.urb8.nr = select(urb8.nr, PONDERAD)
s.urb8.nr = rbind(s.urb8.nr, 0)
nr_urb8 = sum(s.urb8.nr)
urb8 = filter(ECV_021, C1_8==6 | C1_8==7)
s.urb8 = select(urb8, PONDERAD)
p_urb8 = sum(s.urb8)/(n-nr_urb8)
urb8 = p_urb8*100

urb9.nr = filter(ECV_021, is.na(C2_1) | C2_1==99)
s.urb9.nr = select(urb9.nr, PONDERAD)
s.urb9.nr = rbind(s.urb9.nr, 0)
nr_urb9 = sum(s.urb9.nr)
urb9 = filter(ECV_021, C2_1==6 | C2_1==7)
s.urb9 = select(urb9, PONDERAD)
p_urb9 = sum(s.urb9)/(n-nr_urb9)
urb9 = p_urb9*100

urb10.nr = filter(ECV_021, is.na(C2_2) | C2_2==99)
s.urb10.nr = select(urb10.nr, PONDERAD)
s.urb10.nr = rbind(s.urb10.nr, 0)
nr_urb10 = sum(s.urb10.nr)
urb10 = filter(ECV_021, C2_2==6 | C2_2==7)
s.urb10 = select(urb10, PONDERAD)
p_urb10 = sum(s.urb10)/(n-nr_urb10)
urb10 = p_urb10*100

urb11.nr = filter(ECV_021, is.na(C2_3) | C2_3==99)
s.urb11.nr = select(urb11.nr, PONDERAD)
s.urb11.nr = rbind(s.urb11.nr, 0)
nr_urb11 = sum(s.urb11.nr)
urb11 = filter(ECV_021, C2_3==6 | C2_3==7)
s.urb11 = select(urb11, PONDERAD)
p_urb11 = sum(s.urb11)/(n-nr_urb11)
urb11 = p_urb11*100

urb12.nr = filter(ECV_021, is.na(C2_4) | C2_4==99)
s.urb12.nr = select(urb12.nr, PONDERAD)
s.urb12.nr = rbind(s.urb12.nr, 0)
nr_urb12 = sum(s.urb12.nr)
urb12 = filter(ECV_021, C2_4==6 | C2_4==7)
s.urb12 = select(urb12, PONDERAD)
p_urb12 = sum(s.urb12)/(n-nr_urb12)
urb12 = p_urb12*100

ind_urb = (urb1+urb2+urb3+urb4+
             urb5+urb6+urb7+urb8+
             urb9+urb10+urb11+urb12)*1000/1200

#amenazas del medioambiente

#en primer lugar

ma = c(1, 2, 3, 4, 5, 6, 7 ,8 ,9 ,98, 99)
amz = c()

for (i in (ma)) {
  o1 = filter(ECV_021, C3_1==i)
  s.o1 = select(o1, PONDERAD)
  p_o1 = sum(s.o1)/n*100
  amz = rbind(amz, p_o1)
  
}

#en total

amz_tot = c()

for (i in ma) {
  o1 = filter(ECV_021, C3_1==i)
  s.o1 = select(o1, PONDERAD)
  p_o1 = sum(s.o1)/n*100
  o2 = filter(ECV_021, C3_2==i)
  s.o2 = select(o2, PONDERAD)
  p_o2 = sum(s.o2)/n*100
  o3 = filter(ECV_021, C3_3==i)
  s.o3 = select(o3, PONDERAD)
  p_o3 = sum(s.o3)/n*100
  tot_amz = p_o1+p_o2+p_o3
  amz_tot = rbind(amz_tot, tot_amz)
  
}

#transporte público

tr1.nr = filter(ECV_021, is.na(C7_1) | C7_1==99)
s.tr1.nr = select(tr1.nr, PONDERAD)
s.tr1.nr = rbind(s.tr1.nr, 0)
nr_tr1 = sum(s.tr1.nr)
tr1 = filter(ECV_021, C7_1==6 | C7_1==7)
s.tr1 = select(tr1, PONDERAD)
p_tr1 = sum(s.tr1)/(n-nr_tr1)
tr1 = p_tr1*100

tr2.nr = filter(ECV_021, is.na(C7_2) | C7_2==99)
s.tr2.nr = select(tr2.nr, PONDERAD)
s.tr2.nr = rbind(s.tr2.nr, 0)
nr_tr2 = sum(s.tr2.nr)
tr2 = filter(ECV_021, C7_2==6 | C7_2==7)
s.tr2 = select(tr2, PONDERAD)
p_tr2 = sum(s.tr2)/(n-nr_tr2)
tr2 = p_tr2*100

tr3.nr = filter(ECV_021, is.na(C7_3) | C7_3==99)
s.tr3.nr = select(tr3.nr, PONDERAD)
s.tr3.nr = rbind(s.tr3.nr, 0)
nr_tr3 = sum(s.tr3.nr)
tr3 = filter(ECV_021, C7_3==6 | C7_3==7)
s.tr3 = select(tr3, PONDERAD)
p_tr3 = sum(s.tr3)/(n-nr_tr3)
tr3 = p_tr3*100

tr4.nr = filter(ECV_021, is.na(C7_4) | C7_4==99)
s.tr4.nr = select(tr4.nr, PONDERAD)
s.tr4.nr = rbind(s.tr4.nr, 0)
nr_tr4 = sum(s.tr4.nr)
tr4 = filter(ECV_021, C7_4==6 | C7_4==7)
s.tr4 = select(tr4, PONDERAD)
p_tr4 = sum(s.tr4)/(n-nr_tr4)
tr4 = p_tr4*100

tr5.nr = filter(ECV_021, is.na(C7_5) | C7_5==99)
s.tr5.nr = select(tr5.nr, PONDERAD)
s.tr5.nr = rbind(s.tr5.nr, 0)
nr_tr5 = sum(s.tr5.nr)
tr5 = filter(ECV_021, C7_5==6 | C7_5==7)
s.tr5 = select(tr5, PONDERAD)
p_tr5 = sum(s.tr5)/(n-nr_tr5)
tr5 = p_tr5*100

tr6.nr = filter(ECV_021, is.na(C7_6) | C7_6==99)
s.tr6.nr = select(tr6.nr, PONDERAD)
s.tr6.nr = rbind(s.tr6.nr, 0)
nr_tr6 = sum(s.tr6.nr)
tr6 = filter(ECV_021, C7_6==6 | C7_6==7)
s.tr6 = select(tr6, PONDERAD)
p_tr6 = sum(s.tr6)/(n-nr_tr6)
tr6 = p_tr6*100

tr7.nr = filter(ECV_021, is.na(C7_7) | C7_7==99)
s.tr7.nr = select(tr7.nr, PONDERAD)
s.tr7.nr = rbind(s.tr7.nr, 0)
nr_tr7 = sum(s.tr7.nr)
tr7 = filter(ECV_021, C7_7==6 | C7_7==7)
s.tr7 = select(tr7, PONDERAD)
p_tr7 = sum(s.tr7)/(n-nr_tr7)
tr7 = p_tr7*100

tr8.nr = filter(ECV_021, is.na(C7_8) | C7_8==99)
s.tr8.nr = select(tr8.nr, PONDERAD)
s.tr8.nr = rbind(s.tr8.nr, 0)
nr_tr8 = sum(s.tr8.nr)
tr8 = filter(ECV_021, C7_8==6 | C7_8==7)
s.tr8 = select(tr8, PONDERAD)
p_tr8 = sum(s.tr8)/(n-nr_tr8)
tr8 = p_tr8*100

ind_tr= (tr1+tr2+tr3+tr4+
         tr5+tr6+tr7+tr8)*1000/800

#congestión

#satisfacción con la vida
