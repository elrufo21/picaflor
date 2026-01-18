create procedure [dbo].[uspinsertarViaje]                                                        
@ListaOrden varchar(Max)                                                        
as                                                        
begin                                                        
                        
Declare @pos1 int,@pos2 int                                      
Declare @orden varchar(max),                                      
        @detalle varchar(max)                                   
                        
Set @pos1 = CharIndex('[',@ListaOrden,0)                                    
Set @pos2=Len(@ListaOrden)+1                                      
                        
Set @orden = SUBSTRING(@ListaOrden,1,@pos1-1)                                      
Set @detalle = SUBSTRING(@ListaOrden,@pos1+1,@pos2-@pos1-1)                                      
                                                    
Declare @c1 int,@c2 int,@c3 int,@c4 int,                                                        
        @c5 int,@c6 int,@c7 int,@c8 int,                                                        
        @c9 int,@c10 int,@c11 int,@c12 int,                                                        
        @c13 int,@c14 int,@c15 int,@c16 int,                                                        
        @c17 int,@c18 int,@c19 int,@c20 int,                                                        
        @c21 int,@c22 int,@c23 int,@c24 int,                                                        
        @c25 int,@c26 int,@c27 int,@c28 int,                                                        
        @c29 int,@c30 int,@c31 int,@c32 int,                                                        
        @c33 int,@C34 int,@c35 int,@C36 int,                      
        @C37 int,@c38 int,@C39 int,@C40 int,          
        @c41 int,@C42 int,@C43 int,@C44 int,        
        @C45 int,@C46 int,@C47 int       
Declare                                                         
  @NotaDocu varchar(60),@ClienteId numeric(20),                                                        
  @NotaUsuario varchar(60),@NotaFormaPago varchar(60),                                                        
  @NotaCondicion varchar(60),@NotaTelefono varchar(60),                        
  @NotaSubtotal decimal (18,2),@NotaTotal decimal (18,2),                        
  @NotaAcuenta decimal(18,2),@NotaSaldo decimal(18,2),                        
  @NotaAdicional decimal(18,2),@NotaPagar decimal(18,2),                                                        
  @NotaEstado varchar(60),@CompaniaId int,                                                        
  @IncluyeIGV varchar(80),@Serie varchar(20),                        
  @Numero varchar(60),@NotaGanancia decimal(18,2),                        
  @UsuarioId int,@EntidadBancaria varchar(80),                                          
  @NroOperacion varchar(80),@Efectivo decimal(18,2),                                          
  @Deposito decimal(18,2),@IdProducto numeric(20),      
  @Auxiliar varchar(250),@TelefonoAuxiliar varchar(250),      
  @CantidadPax int,@PuntoPartida varchar(max),      
  @HoraPartida varchar(80),@otrasPartidas varchar(max),      
  @VisitasExCur varchar(max),@CobroExtraSol decimal(18,2),      
  @CobroExtraDol decimal(18,2),@FechaAdelanto date,      
  @MensajePasajero varchar(300),@Observaciones varchar(max),                    
  @Islas nvarchar(10),@Tubulares nvarchar(10),@otros nvarchar(10),                    
  @FechaViaje date,@IGV decimal(18,2),@IncluyeCargos varchar(140),            
  @Monedas varchar(10),@IncluyeALmuerzo varchar(80),      
  @NotaImagen varchar(max),@Hotel varchar(250),@Region varchar(80)          
                          
  Declare @CajaId varchar(38),                        
  @Movimiento varchar(40)                          
                        
Set @c1 =CharIndex('|',@orden,0)                                                        
Set @c2 =CharIndex('|',@orden,@c1+1)                                                        
Set @c3 =CharIndex('|',@orden,@c2+1)                                     
Set @c4 =CharIndex('|',@orden,@c3+1)                                                        
Set @c5 =CharIndex('|',@orden,@c4+1)                                                        
Set @c6 =CharIndex('|',@orden,@c5+1)                                                        
Set @c7 =CharIndex('|',@orden,@c6+1)                                    
Set @c8 =CharIndex('|',@orden,@c7+1)                                                        
Set @c9 =CharIndex('|',@orden,@c8+1)                                                    
Set @c10=CharIndex('|',@orden,@c9+1)                                                        
Set @c11=CharIndex('|',@orden,@c10+1)                                                        
Set @c12=CharIndex('|',@orden,@c11+1)                                                        
Set @c13=CharIndex('|',@orden,@c12+1)                                           
Set @c14=CharIndex('|',@orden,@c13+1)                                        
Set @c15=CharIndex('|',@orden,@c14+1)                                                   
Set @c16=CharIndex('|',@orden,@c15+1)                                                        
Set @c17=CharIndex('|',@orden,@c16+1)                                              
Set @c18=CharIndex('|',@orden,@c17+1)                                                        
Set @c19=CharIndex('|',@orden,@c18+1)                                             
Set @c20=CharIndex('|',@orden,@c19+1)                                                        
Set @c21=CharIndex('|',@orden,@c20+1)                                                        
Set @c22=CharIndex('|',@orden,@c21+1)                                                       
Set @c23=CharIndex('|',@orden,@c22+1)                                                        
Set @c24=CharIndex('|',@orden,@c23+1)                                                        
Set @c25=CharIndex('|',@orden,@c24+1)                                                        
Set @c26=CharIndex('|',@orden,@c25+1)                                                        
Set @c27=CharIndex('|',@orden,@c26+1)                                               
Set @c28=CharIndex('|',@orden,@c27+1)                                                        
Set @c29=CharIndex('|',@orden,@c28+1)                                                        
Set @c30=CharIndex('|',@orden,@c29+1)                                                        
Set @c31=CharIndex('|',@orden,@c30+1)                                                        
Set @c32=CharIndex('|',@orden,@c31+1)                                                  
Set @c33=CharIndex('|',@orden,@c32+1)                                          
Set @c34=CharIndex('|',@orden,@c33+1)                                                        
Set @c35=CharIndex('|',@orden,@c34+1)                      
                      
Set @C36=CharIndex('|',@orden,@c35+1)                                          
Set @C37=CharIndex('|',@orden,@C36+1)                                                        
Set @c38=CharIndex('|',@orden,@C37+1)                       
                    
Set @C39=CharIndex('|',@orden,@c38+1)                                                        
Set @C40=CharIndex('|',@orden,@C39+1)                    
Set @c41=CharIndex('|',@orden,@C40+1)            
Set @C42=CharIndex('|',@orden,@c41+1)             
Set @C43=CharIndex('|',@orden,@C42+1)        
Set @C44=CharIndex('|',@orden,@C43+1)      
Set @C45=CharIndex('|',@orden,@C44+1)    
Set @C46=CharIndex('|',@orden,@C45+1)      
Set @C47=Len(@orden)+1                                      
                                                        
set @NotaDocu=SUBSTRING(@orden,1,@c1-1)                                                        
set @ClienteId=convert(numeric(20),SUBSTRING(@orden,@c1+1,@c2-@c1-1))                                                        
set @NotaUsuario=SUBSTRING(@orden,@c2+1,@c3-@c2-1)                                                        
set @NotaFormaPago=SUBSTRING(@orden,@c3+1,@c4-@c3-1)                    
set @NotaCondicion=SUBSTRING(@orden,@c4+1,@c5-@c4-1)                                                  
set @NotaTelefono=SUBSTRING(@orden,@c5+1,@c6-@c5-1)                                                        
set @NotaSubtotal=convert(decimal(18,2),SUBSTRING(@orden,@c6+1,@c7-@c6-1))                                
set @NotaTotal=convert(decimal(18,2),SUBSTRING(@orden,@c7+1,@c8-@c7-1))                                                        
set @NotaAcuenta=convert(decimal(18,2),SUBSTRING(@orden,@c8+1,@c9-@c8-1))                      
set @NotaSaldo=convert(decimal(18,2),SUBSTRING(@orden,@c9+1,@c10-@c9-1))                                                        
set @NotaAdicional=convert(decimal(18,2),SUBSTRING(@orden,@c10+1,@c11-@c10-1))                                                                                     
set @NotaPagar=convert(decimal(18,2),SUBSTRING(@orden,@c11+1,@c12-@c11-1))                                                        
set @NotaEstado=SUBSTRING(@orden,@c12+1,@c13-@c12-1)                                                        
set @CompaniaId=convert(int,SUBSTRING(@orden,@c13+1,@c14-@c13-1))                                                                               
set @IncluyeIGV=SUBSTRING(@orden,@c14+1,@c15-@c14-1)                                                        
set @Serie=SUBSTRING(@orden,@c15+1,@c16-@c15-1)                                                        
set @Numero=SUBSTRING(@orden,@c16+1,@c17-@c16-1)                                                        
set @NotaGanancia=convert(decimal(18,2),SUBSTRING(@orden,@c17+1,@c18-@c17-1))                               
set @UsuarioId=convert(int,SUBSTRING(@orden,@c18+1,@c19-@c18-1))                                                                                                 
set @EntidadBancaria=SUBSTRING(@orden,@c19+1,@c20-@c19-1)                                                
set @NroOperacion=SUBSTRING(@orden,@c20+1,@c21-@c20-1)                                                
set @Efectivo=convert(decimal(18,2),SUBSTRING(@orden,@c21+1,@c22-@c21-1))                                                
set @Deposito=convert(decimal(18,2),SUBSTRING(@orden,@c22+1,@c23-@c22-1))                        
set @IdProducto=convert(numeric(20),SUBSTRING(@orden,@c23+1,@c24-@c23-1))                                                        
set @Auxiliar=SUBSTRING(@orden,@c24+1,@c25-@c24-1)                                                        
set @TelefonoAuxiliar=SUBSTRING(@orden,@c25+1,@c26-@c25-1)                                                                             
set @CantidadPax=convert(int,SUBSTRING(@orden,@c26+1,@c27-@c26-1))                                                      
set @PuntoPartida=SUBSTRING(@orden,@c27+1,@c28-@c27-1)                                                        
set @HoraPartida=SUBSTRING(@orden,@c28+1,@c29-@c28-1)                                                        
set @otrasPartidas=SUBSTRING(@orden,@c29+1,@c30-@c29-1)                                                                  
set @VisitasExCur=SUBSTRING(@orden,@c30+1,@c31-@c30-1)                                                                                                 
set @CobroExtraSol=convert(decimal(18,2),SUBSTRING(@orden,@c31+1,@c32-@c31-1))                                               
set @CobroExtraDol=convert(decimal(18,2),SUBSTRING(@orden,@c32+1,@c33-@c32-1))                                               
set @FechaAdelanto=convert(date,SUBSTRING(@orden,@c33+1,@C34-@c33-1))                                                
set @MensajePasajero=SUBSTRING(@orden,@C34+1,@c35-@C34-1)                        
set @Observaciones=SUBSTRING(@orden,@c35+1,@C36-@c35-1)                      
set @Islas=SUBSTRING(@orden,@C36+1,@C37-@C36-1)                      
set @Tubulares=SUBSTRING(@orden,@C37+1,@c38-@C37-1)                      
set @otros=SUBSTRING(@orden,@c38+1,@C39-@c38-1)                      
set @FechaViaje=convert(date,SUBSTRING(@orden,@C39+1,@C40-@C39-1))                      
set @IGV=convert(decimal(18,2),SUBSTRING(@orden,@C40+1,@c41-@C40-1))          
set @IncluyeCargos=SUBSTRING(@orden,@c41+1,@C42-@c41-1)            
set @Monedas=SUBSTRING(@orden,@C42+1,@C43-@C42-1)          
set @IncluyeALmuerzo=SUBSTRING(@orden,@C43+1,@C44-@C43-1)        
set @NotaImagen=SUBSTRING(@orden,@C44+1,@C45-@C44-1)      
set @Hotel=SUBSTRING(@orden,@C45+1,@C46-@C45-1)    
set @Region=SUBSTRING(@orden,@C46+1,@C47-@C46-1)    
                                                            
set @CajaId=isnull((select top 1 convert(varchar,c.CajaId) from Caja c                                               
where c.CompaniaId=@CompaniaId and (c.CajaEstado='ACTIVO' and c.UsuarioId=@UsuarioId)                           
order by 1 desc),'0')                                                   
                                              
if(@CajaId=0)                                                        
begin                                                        
select 'false'                                                        
END                                                       
                
ELSE IF EXISTS(select top 1 NroOperacion                          
from NotaPedido                           
where EntidadBancaria=@EntidadBancaria and EntidadBancaria<>'-' and                 
NroOperacion=@NroOperacion and NroOperacion<>'' and NotaEstado<>'ANULADO')                          
begin                          
select 'OPERACION'                          
END                  
                
else                                                        
begin                                              
                  
/*                              
EFECTIVO                       
DEPOSITO                              
TARJETA                              
YAPE                              
EFECTIVO/DEPOSITO                              
TARJETA/EFECTIVO                              
YAPE/EFECTIVO                              
YAPE/DEPOSITO                              
TARJETA/DEPOSITO                              
*/                              
                              
Declare @pZ1 int=0                              
                              
if(@NotaFormaPago='YAPE/DEPOSITO' or @NotaFormaPago='TARJETA/DEPOSITO')                              
begin                              
set @Movimiento='DEPOSITO'                               
end                              
else                              
begin                              
Declare @pZ2 int                              
Declare @FormaA varchar(max),                                            
        @FormaB varchar(max),                              
        @MovimientoB varchar(40)                              
                                               
Set @pZ1 = CharIndex('/',@NotaFormaPago,0)                              
                              
if(@pZ1>0)                              
begin                              
                              
Set @pZ2 =Len(@NotaFormaPago)+1                              
Set @FormaA = SUBSTRING(@NotaFormaPago,1,@pZ1-1)                              
Set @FormaB = SUBSTRING(@NotaFormaPago,@pZ1+1,@pZ2-@pZ1-1)                              
                              
if(@FormaA='EFECTIVO')set @Movimiento='INGRESO'                                            
else if(@FormaA='DEPOSITO')set @Movimiento='DEPOSITO'                                            
else if(@FormaA='YAPE' OR @FormaA='PLIN' or @FormaA='PEDIDOSYA')set @Movimiento='DEPOSITO'                                            
else set @Movimiento='TARJETA'                               
                              
if(@FormaB='EFECTIVO')set @MovimientoB='INGRESO'                                            
else if(@FormaB='DEPOSITO')set @MovimientoB='DEPOSITO'                   
else if(@FormaB='YAPE' OR @FormaB='PLIN' or @FormaB='PEDIDOSYA')set @MovimientoB='DEPOSITO'                                            
else set @MovimientoB='TARJETA'                               
                              
END                              
Else                              
begin                              
                              
if(@NotaFormaPago='EFECTIVO')set @Movimiento='INGRESO'                                            
else if(@NotaFormaPago='DEPOSITO')set @Movimiento='DEPOSITO'                                            
else if(@NotaFormaPago='YAPE' OR @NotaFormaPago='PLIN' or @NotaFormaPago='PEDIDOSYA')set @Movimiento='DEPOSITO'                                            
else set @Movimiento='TARJETA'                               
                              
End                              
End                      
                  
                                                  
declare @NotaId numeric(38)                                       
                                                                            
Begin Transaction    

DECLARE @ClienteColumna VARCHAR(MAX)
DECLARE @ClienteNuevoId NUMERIC(20)


SET @ClienteColumna =
    CONVERT(VARCHAR, @ClienteId) + '|' +
    ISNULL(@nombrePax, '-') + '|' +        -- ClienteRazon
    '-' + '|' +                              -- ClienteRuc
    @dniPax + '|' +                              -- ClienteDni
    '-' + '|' +                              -- ClienteDireccion
    '-' + '|' +                              -- ClienteMovil
    ISNULL(@NotaTelefono, '-') + '|' +       -- ClienteTelefono
    '-' + '|' +                              -- ClienteCorreo
    'ACTIVO' + '|' +                         -- ClienteEstado
    '-' + '|' +                              -- ClienteDespacho
    @UsuarioId + '|' +                     -- Usuario
    CONVERT(VARCHAR, @CompaniaId)


DECLARE @ClienteResult TABLE (ClienteId NUMERIC(20))

INSERT INTO @ClienteResult
EXEC insertaClienteLD @ClienteColumna

SELECT @ClienteNuevoId = ClienteId FROM @ClienteResult

SET @ClienteId = @ClienteNuevoId
                       
                    
if(@NotaDocu='DOCUMENTO COBRANZA')                        
begin                        
declare @cod varchar(13)                            
SET @cod=ISNULL((select TOP 1                                                   
dbo.genenerarNroFactura('0001',@CompaniaId,@NotaDocu) AS ID                                                   
FROM NotaPedido),'00000001')                        
set @Serie='0001'                        
set @Numero=@cod                        
end                    
if(@NotaSaldo>0)SET @NotaEstado='PENDIENTE'                    
                        
insert into NotaPedido values(@NotaDocu,@ClienteId,GETDATE(),@NotaUsuario,                                                   
@NotaFormaPago,@NotaCondicion,1,@FechaViaje,@NotaTelefono,                                                        
@NotaSubtotal,@NotaTotal,@NotaAcuenta,@NotaSaldo,                                                        
@NotaAdicional,@NotaPagar,@NotaEstado,@CompaniaId,                    
'','',@Serie,@Numero,@NotaGanancia,@CajaId,                                          
@EntidadBancaria,@NroOperacion,@Efectivo,@Deposito,                        
@IdProducto,@Auxiliar,@TelefonoAuxiliar,@CantidadPax,                        
@PuntoPartida,@HoraPartida,@otrasPartidas,@VisitasExCur,                        
@CobroExtraSol,@CobroExtraDol,@FechaAdelanto,@MensajePasajero,                      
@Observaciones,@Islas,@Tubulares,@otros,@IncluyeIGV,@IGV,@IncluyeCargos,        
@Monedas,@IncluyeALmuerzo,@NotaImagen,@Hotel,@Region,@UsuarioId)                      
                    
set @NotaId=(select @@IDENTITY)                   
                  
if(@NotaCondicion<>'CREDITO')                                  
BEGIN                                   
if(@pZ1>0)                              
begin                              
    if(@Movimiento='INGRESO')                              
    BEGIN                              
    insert into CajaDetalle values(@CajaId,GETDATE(),@NotaId,@Movimiento,'',                                            
    'Transacción con '+@NotaFormaPago,@Efectivo,@Efectivo,0,'','T','',@NotaUsuario,'','')                                            
    END                              
    else                              
    begin                              
    insert into CajaDetalle values(@CajaId,GETDATE(),@NotaId,@Movimiento,'',                                            
    'Transacción con '+@NotaFormaPago,@Deposito,@Deposito,0,'','T','',@NotaUsuario,'','')                               
    end                              
    if(@MovimientoB='INGRESO')                              
    BEGIN                              
    insert into CajaDetalle values(@CajaId,GETDATE(),@NotaId,@MovimientoB,'',                                            
    'Transacción con '+@NotaFormaPago,@Efectivo,@Efectivo,0,'','T','',@NotaUsuario,'','')                               
    END                              
    ELSE                          
    BEGIN                              
    insert into CajaDetalle values(@CajaId,GETDATE(),@NotaId,@MovimientoB,'',                       
    'Transacción con '+@NotaFormaPago,@Deposito,@Deposito,0,'','T','',@NotaUsuario,'','')                               
    END                                                    
END                  
ELSE                               
BEGIN                              
    insert into CajaDetalle values(@CajaId,GETDATE(),@NotaId,@Movimiento,'',                                            
    'Transacción con '+@NotaFormaPago,@NotaAcuenta,@NotaAcuenta,0,'','T','',@NotaUsuario,'','')                                
END                              
END                  
                  
Declare TablaB Cursor For Select * From fnSplitString(@detalle,';')                                       
Open TablaB                                    
Declare @ColumnaB varchar(max)                                    
Declare @g1 int,@g2 int,                                    
        @g3 int,@g4 int                                   
                                    
Declare @Actividades varchar(350),                        
  @Precio  decimal(18,2),                        
  @Cantidad int,                        
  @Importe decimal(18,2)                                 
                                    
Fetch Next From TablaB INTO @ColumnaB                                      
 While @@FETCH_STATUS = 0                                      
 Begin                                      
Set @g1 = CharIndex('|',@ColumnaB,0)             
Set @g2 = CharIndex('|',@ColumnaB,@g1+1)                                                        
Set @g3 = CharIndex('|',@ColumnaB,@g2+1)                                                                                       
Set @g4=Len(@ColumnaB)+1                                       
                                     
set @Actividades=SUBSTRING(@ColumnaB,1,@g1-1)                                    
Set @Precio=Convert(decimal(18,2),SUBSTRING(@ColumnaB,@g1+1,@g2-(@g1+1)))                                    
Set @Cantidad=Convert(int,SUBSTRING(@ColumnaB,@g2+1,@g3-(@g2+1)))                                      
Set @Importe=Convert(decimal(18,2),SUBSTRING(@ColumnaB,@g3+1,@g4-(@g3+1)))                                      
                                         
insert into DetalleActividades values(@NotaId,@Actividades,@Precio,@Cantidad,@Importe)                                
                                    
Fetch Next From TablaB INTO @ColumnaB                                      
end                                      
    Close TablaB;                                      
    Deallocate TablaB;                                      
    Commit Transaction;                                  
    select convert(varchar,@NotaId)+'¬'+@Serie+'¬'+@Numero+'¬'+convert(varchar,GETDATE(),103)+' '+        
    SUBSTRING(convert(varchar,GETDATE(),114),1,8)                        
End                        
End      