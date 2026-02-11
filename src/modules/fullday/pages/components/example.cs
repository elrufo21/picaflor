using MegaRosita.Capa.Comun;
using MegaRosita.Capa.Entidades;
using MegaRosita.Capa.Logica;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms; 
using TEXTO = iTextSharp.text;
using PDFT = iTextSharp.text.pdf;
using System.IO;
using System.Security.Cryptography;
using System.Drawing.Imaging;
using System.Net.NetworkInformation;
using ClosedXML.Excel;
using System.Text.RegularExpressions;
using System.Globalization;

namespace MegaRosita.Capa.Aplicacion
{
    public partial class NuevoViaje : Form
    {
        Mensajes men = new Mensajes();
        LogCliente objcliente = new LogCliente();

        Conexion xconexion = new Conexion();

        bool xIpValida = false;

        string[] xlistas;
        List<EGeneral> listaServicios;
        List<EGeneral> listaServiciosAG;
        List<EGeneral> listaAuxiliar;
        List<EGeneral> listaActividades;
        List<EGeneral> listaPartidas;
        List<EGeneral> listaAlmuerzo;
        List<EGeneral> listaTraslado;
        List<EGeneral> listaHoteles;
        List<EGeneral> listaRegiones;

        public string xRuc { get; set; }
        string xTransporte { get; set; }
        string xGuia { get; set; }
        public string xUsuario { get; set; }
        public string xArea { get; set; }
        public string xIdCompania { get; set; }
        public string xIdUsuario { get; set; }
        public string xAreaId { get; set; }
        int xflac { get; set; }
        int xSoli { get; set; }
        double xTotalPri = 0;

        private DataTable Tabla;
        BindingSource bs;
        private DataView vista;

        private DataTable TablaV;
        BindingSource bsV;
        private DataView vistaV;

        string xDetaId_1 = string.Empty;
        string xDetaId_2 = string.Empty;
        string xDetaId_3 = string.Empty;
        string xDetaId_4 = string.Empty;
        string xDetaId_5 = string.Empty;
        string xDetaId_6 = string.Empty;
        int xAviso = 0;

        string ImageNula = string.Empty;

        decimal xtotalEnAl = 0;
        decimal xPrecioTours = 0;
        int xflacMon = 0;

        int xErrorArchivo = 0;
        int xSizeTextoPDF = 8;

        int xMaximo = 0;
        string xCantMax = string.Empty;
        string xCanPax = string.Empty;
        public string xRegion { get; set; }
        string xrut = string.Empty;
        Regex Val = new Regex("^([1-9]|1[0-2]|0[1-9]){1}(:[0-5][0-9][aApP][mM]){1}$");

        double xAcuenta_Fijo = 0;
        double xSaldo_Fijo = 0;

        double xEfec_Fijo = 0;
        double xDepo_Fijo = 0;

        public NuevoViaje()
        {
            InitializeComponent();
            xflac = 0;
            xSoli = 0;
            ImageNula = "\\\\" + xconexion.ServidorIP + "\\ArchivoSistema\\FullDay\\BouchersPagos\\file.png";
        }
        public void listarB()
        {
            xDetaId_1 = string.Empty;
            xDetaId_2 = string.Empty;
            xDetaId_3 = string.Empty;
            xDetaId_4 = string.Empty;
            xDetaId_5 = string.Empty;
            xDetaId_6 = string.Empty;
            xRegion = string.Empty;
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("listaDetalleNotaB", "@NotaId", this.lblIdNota.Text);
            if (!string.IsNullOrEmpty(rpt))
            {
                string[] xFilas;
                string[] xData_1;
                string[] xData_2;
                string[] xData_3;
                string[] xData_4;
                string[] xData_5;
                string[] xData_6;
                xFilas = rpt.Split('¬');
                
                xData_1= xFilas[0].Split('|');
                xDetaId_1 = xData_1[0];
                cmdAlmuerzo.Text = xData_1[1];
                txtPrecio_1.Text = xData_1[2];
                txtCan1.Text = xData_1[3];
                txtSubTotal_1.Text= xData_1[4];

                xData_2 = xFilas[1].Split('|');
                xDetaId_2 = xData_2[0];
                cmdActividades.Text = xData_2[1];
                txtPrecio_2.Text = xData_2[2];
                txtCan2.Text = xData_2[3];
                txtSubTotal_2.Text = xData_2[4];

                xData_3 = xFilas[2].Split('|');
                xDetaId_3 = xData_3[0];
                cmdActividades_2.Text = xData_3[1];
                txtPrecio_3.Text = xData_3[2];
                txtCan3.Text = xData_3[3];
                txtSubTotal_3.Text = xData_3[4];

                xData_4= xFilas[3].Split('|');
                xDetaId_4 = xData_4[0];
                cmdActividades_3.Text = xData_4[1];
                txtPrecio_4.Text = xData_4[2];
                txtCan4.Text = xData_4[3];
                txtSubTotal_4.Text = xData_4[4];

                xData_5= xFilas[4].Split('|');
                xDetaId_5= xData_5[0];
                cmdTraslados.Text = xData_5[1];
                txtPrecio_5.Text = xData_5[2];
                txtCan5.Text = xData_5[3];
                txtSubTotal_5.Text = xData_5[4];

                xData_6 = xFilas[5].Split('|');
                xDetaId_6= xData_6[0];
                txtEntradas.Text = xData_6[1];
                txtPrecio_6.Text = xData_6[2];
                txtCan6.Text = xData_6[3];
                txtSubTotal_6.Text = xData_6[4];
            }
        }
        public void totalista()
        {
            decimal tarjeta = 0;
            decimal total = 0;
            decimal efectivo = 0;
            decimal xganancia = 0;
            //
            decimal tarjetaDol = 0;
            decimal totalDol = 0;
            decimal efectivoDol = 0;
            decimal xgananciaDol = 0;
            if (gvpanel.Rows.Count > 0)
            {
                foreach (DataGridViewRow row in gvpanel.Rows)
                {
                    if (Convert.ToString(row.Cells[28].Value) != "ANULADO")
                    {
                        if (Convert.ToString(row.Cells[45].Value) == "SOLES")
                        {
                            xganancia += Convert.ToDecimal(row.Cells[24].Value);
                            efectivo += Convert.ToDecimal(row.Cells[33].Value);
                            tarjeta += Convert.ToDecimal(row.Cells[34].Value);
                        }
                        else
                        {
                            xgananciaDol += Convert.ToDecimal(row.Cells[24].Value);
                            efectivoDol += Convert.ToDecimal(row.Cells[33].Value);
                            tarjetaDol += Convert.ToDecimal(row.Cells[34].Value);
                        }
                    }
                }
                total = efectivo + tarjeta;
                lbltarjeta.Text = (tarjeta).ToString("N2");
                lblefectivo.Text = (efectivo).ToString("N2");
                lbltotalB.Text = (total).ToString("N2");
                ////
                totalDol = efectivoDol + tarjetaDol;
                lbltarjetaDolar.Text = (tarjetaDol).ToString("N2");
                lblefectivoDolar.Text = (efectivoDol).ToString("N2");
                lblTotalDolar.Text = (totalDol).ToString("N2");
            }
            else
            {
                lblefectivo.Text = "0.00";
                lbltarjeta.Text = "0.00";
                lbltotalB.Text = "0.00";
                //
                lblefectivoDolar.Text = "0.00";
                lbltarjetaDolar.Text = "0.00";
                lblTotalDolar.Text = "0.00";
            }
            this.lblcantidad.Text = gvpanel.Rows.Count.ToString("N0");
        }
        #region Metodos
        public void traerFinal()
        {
            DataTable datos = objcliente.traerCliente(this.txtcliente.Text, xIdCompania.ToString());
            if (datos.Rows.Count == 0)
            {
                MessageBox.Show("El Cliente que escribio no existe...favor de crearlo", "ERROR", MessageBoxButtons.OK, MessageBoxIcon.Error);
                txtcliente.Text = "";
                lblidCliente.Text = "";
                txtDni.Text ="";
                txtcelular.Text = "";
                txtcliente.Focus();
            }
            else
            {
                lblidCliente.Text = datos.Rows[0][0].ToString();
                txtDni.Text = datos.Rows[0][3].ToString();
                txtcelular.Text = datos.Rows[0][6].ToString();
            }
        }
        public void crearCliente()
        {
            string xvalue = string.Empty;
            string xidClien = string.Empty;
            xidClien = (lblidCliente.Text.Length == 0) ? "0":lblidCliente.Text;
            xvalue =xidClien+"|" + txtcliente.Text.ToUpper().Trim() + "||"+txtDni.Text.ToUpper().Trim()+"|||" +
                txtcelular.Text.ToUpper() + "||||" + xUsuario + "|" + xIdCompania;
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("insertaClienteLD", "@Columna", xvalue);
            if (!string.IsNullOrEmpty(rpt))
            {
                if (rpt.Equals("true"))
                {
                    traerFinal();
                }
                else if (rpt.Equals("NOMBRE"))
                {
                    traerFinal();
                }
            }
            else
            {
                men.ErrorGuardado();
            }
        }
        public bool validarAcuenta()
        {
            bool Escorrecto = false;
            double vacuenta = 0;
            double vefectivo = 0;
            double vdepo = 0;
            double vpromedio = 0;

            if (txtAcuenta.Text.Length == 0) vacuenta = 0;
            else vacuenta = double.Parse(txtAcuenta.Text);

            if (txtdeposito.Text.Length == 0) vdepo = 0;
            else vdepo = double.Parse(txtdeposito.Text);

            if (txtefectivo.Text.Length == 0) vefectivo = 0;
            else vefectivo = double.Parse(txtefectivo.Text);

            vpromedio = vefectivo + vdepo;
            Escorrecto = (vacuenta == vpromedio) ? Escorrecto =true : Escorrecto =false;

            return Escorrecto;
        }
        //
        public void validarEditar()
        {
            if (cmdServicios.SelectedValue.ToString() == "0")
            {
                MessageBox.Show("SELECCIONE EL VIAJE QUE SE VA REALIZAR", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdServicios.Focus();
            }
            else if (cmdAuxiliar.SelectedValue.ToString() == "0")
            {
                MessageBox.Show("SELECCIONE UN CANAL DE VENTA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdAuxiliar.Focus();
            }
            else if (cmdCondicion.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE LA CONDICION DEL SERVICIO DE VIAJE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdCondicion.Focus();
            }
            else if (cmdPartidas.SelectedValue.ToString() == "0")
            {
                MessageBox.Show("SELECCIONE EL PUNTO DE PARTIDA DE VIAJE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdPartidas.Focus();
            }
            else if (cmdAlmuerzo.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE SI INCLUYE ALMUERZO EL TOURS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdAlmuerzo.Focus();
            }
            else if (cmdTraslados.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE SI INCLUYE TRASLADO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdTraslados.Focus();
            }
            else if (cmdIgv.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE SI INCLUYE IGV", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdIgv.Focus();
            }
            else if (cmdCargos.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE SI INCLUYE CARGOS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdCargos.Focus();
            }
            else if (cmdMedioPago.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE EL MEDIO DE PAGO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdMedioPago.Focus();
            }
            else if (cmdEntidad.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE LA ENTIDAD BANCARIA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdEntidad.Focus();
            }
            else
            {
                if (txtcliente.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE EL NOMBRE DEL CLIENTE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txtcliente.Focus();
                }
                else if (txttelefono.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE EL TELEFONO DEL CLIENTE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txttelefono.Focus();
                }
                else if (txtCantPasajeros.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE LA CANTIDAD DE PASAJEROS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txtCantPasajeros.Focus();
                }
                else if (txtHoraPar.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE LA HORA DE PARTIDA DEL TOURS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txtHoraPar.Focus();
                }
                else if (txtVisitasExcursion.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE LAS VISITAS Y EXCURSIONES DEL VIAJE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txtVisitasExcursion.Focus();
                }
                else
                {
                    if (txtPrecio_1.Text.Length == 0)
                    {
                        MessageBox.Show("INGRESE EL PRECIO DEL VIAJE O TOURS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        txtPrecio_1.Focus();
                    }
                    else
                    {
                        if (cmdActividades.SelectedValue.ToString() != "0" && (txtPrecio_2.Text.Length == 0 && txtPrecio_2.Enabled == true))
                        {
                            MessageBox.Show("SI SELECCIONO UNA PRIMERA ACTIVIDAD INGRESE EL PRECIO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            txtPrecio_2.Focus();
                        }
                        else if (cmdActividades.SelectedValue.ToString() != "0" && (txtCan2.Text.Length == 0 && txtCan2.Enabled == true))
                        {
                            MessageBox.Show("SI SELECCIONO UNA PRIMERA ACTIVIDAD INGRESE LA CANTIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            txtCan2.Focus();
                        }
                        else if (cmdActividades_2.SelectedValue.ToString() != "0" && (txtPrecio_3.Text.Length == 0 && txtPrecio_3.Enabled == true))
                        {
                            MessageBox.Show("SI SELECCIONO UNA SEGUNDA ACTIVIDAD INGRESE EL PRECIO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            txtPrecio_3.Focus();
                        }
                        else if (cmdActividades_2.SelectedValue.ToString() != "0" && (txtCan3.Text.Length == 0 && txtCan3.Enabled == true))
                        {
                            MessageBox.Show("SI SELECCIONO UNA SEGUNDA ACTIVIDAD INGRESE LA CANTIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            txtCan3.Focus();
                        }
                        else
                        {
                            if ((txtPrecio_5.Text.Length == 0 && txtPrecio_5.Enabled == true))
                            {
                                MessageBox.Show("SI SELECCIONO QUE INCLUYE TRASLADO...INGRESE EL PRECIO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                txtPrecio_5.Focus();
                            }
                            //else if ((txtCan5.Text.Length == 0 && txtCan5.Enabled == true))
                            //{
                            //    MessageBox.Show("SI SELECCIONO QUE INCLUYE TRASLADO...INGRESE LA CANTIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            //    txtCan5.Focus();
                            //}
                            else
                            {
                                if (decimal.Parse(txtTotalPagar.Text) == 0)
                                {
                                    MessageBox.Show("EL DOCUMENTO NO PUEDE SER CERO EN TOTAL A PAGAR...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                }
                                else
                                {
                                    if (cmdCondicion.Text.Contains("ACUENTA") && txtAcuenta.Text.Length == 0)
                                    {
                                        MessageBox.Show("SI SELECCIONO LA CONDICION ACUENTA, INGRESAR EL MONTO QUE LE DIO...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                        txtAcuenta.Focus();
                                    }
                                    else
                                    {
                                        if (cmdCondicion.Text.Contains("ACUENTA") && decimal.Parse(txtAcuenta.Text) <= 0)
                                        {
                                            MessageBox.Show("SI SELECCIONO LA CONDICION ACUENTA, EL MONTO NO PUEDE SER CERO...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                            txtAcuenta.SelectionStart = txtAcuenta.Text.Length;
                                            txtAcuenta.Focus();
                                        }
                                        else
                                        {
                                            if (validarAcuenta() == false)
                                            {
                                                MessageBox.Show("LA SUMA DEL ACUENTA CON EL EFECTIVO SUPERA AL MONTO TOTAL DE PAGO..!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                                            }
                                            else
                                            {
                                                if (!Val.IsMatch(txtHoraPar.Text))
                                                {
                                                    MessageBox.Show("INGRESE CORRECTAMENTE LA HORA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                                                    txtHoraPar.Focus();
                                                }
                                                else
                                                {
                                                    if (validarCantPax("uspValidarDisponibilidadE") == true)
                                                    {
                                                        editar();
                                                    }
                                                    else
                                                    {
                                                        MessageBox.Show("YA SUPERO EL LIMITE DE PASAJEROS POR DIA, QUE ES DE (" + xCantMax + "), " +
                                                      "Y ACTUALMENTE TIENE OCUPADOS (" + xCanPax + ") FAVOR DE VERIFICAR OTRA FECHA", "AVISO",
                                                       MessageBoxButtons.OK, MessageBoxIcon.Stop);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        //
        public void validarGuardado()
        {
            if (cmdServicios.SelectedValue.ToString() == "0")
            {
                MessageBox.Show("SELECCIONE EL VIAJE QUE SE VA REALIZAR", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdServicios.Focus();
            }
            else if (cmdAuxiliar.SelectedValue.ToString() == "0")
            {
                MessageBox.Show("SELECCIONE UN CANAL DE VENTA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdAuxiliar.Focus();
            }
            else if (cmdCondicion.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE LA CONDICION DEL SERVICIO DE VIAJE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdCondicion.Focus();
            }
            else if (cmdPartidas.SelectedValue.ToString() == "0")
            {
                MessageBox.Show("SELECCIONE EL PUNTO DE PARTIDA DE VIAJE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdPartidas.Focus();
            }
            else if (cmdAlmuerzo.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE SI INCLUYE ALMUERZO EL TOURS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdAlmuerzo.Focus();
            }
            else if (cmdTraslados.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE SI INCLUYE TRASLADO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdTraslados.Focus();
            }
            else if (cmdIgv.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE SI INCLUYE IGV", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdIgv.Focus();
            }
            else if (cmdCargos.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE SI INCLUYE CARGOS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdCargos.Focus();
            }
            else if (cmdMedioPago.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE EL MEDIO DE PAGO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdMedioPago.Focus();
            }
            else if (cmdEntidad.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE LA ENTIDAD BANCARIA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdEntidad.Focus();
            }
            else
            {
                if (txtcliente.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE EL NOMBRE DEL CLIENTE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txtcliente.Focus();
                }
                else if (txttelefono.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE EL TELEFONO DEL CLIENTE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txttelefono.Focus();
                }
                else if (txtCantPasajeros.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE LA CANTIDAD DE PASAJEROS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txtCantPasajeros.Focus();
                }
                else if (txtHoraPar.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE LA HORA DE PARTIDA DEL TOURS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txtHoraPar.Focus();
                }
                else if (txtVisitasExcursion.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE LAS VISITAS Y EXCURSIONES DEL VIAJE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txtVisitasExcursion.Focus();
                }
                else
                {
                    if (txtPrecio_1.Text.Length == 0)
                    {
                        MessageBox.Show("INGRESE EL PRECIO DEL VIAJE O TOURS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        txtPrecio_1.Focus();
                    }
                    else
                    {
                        if (cmdActividades.SelectedValue.ToString() != "0" && (txtPrecio_2.Text.Length == 0 && txtPrecio_2.Enabled == true))
                        {
                            MessageBox.Show("SI SELECCIONO UNA PRIMERA ACTIVIDAD INGRESE EL PRECIO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            txtPrecio_2.Focus();
                        }
                        else if (cmdActividades.SelectedValue.ToString() != "0" && (txtCan2.Text.Length == 0 && txtCan2.Enabled == true))
                        {
                            MessageBox.Show("SI SELECCIONO UNA PRIMERA ACTIVIDAD INGRESE LA CANTIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            txtCan2.Focus();
                        }
                        else if (cmdActividades_2.SelectedValue.ToString() != "0" && (txtPrecio_3.Text.Length == 0 && txtPrecio_3.Enabled == true))
                        {
                            MessageBox.Show("SI SELECCIONO UNA SEGUNDA ACTIVIDAD INGRESE EL PRECIO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            txtPrecio_3.Focus();
                        }
                        else if (cmdActividades_2.SelectedValue.ToString() != "0" && (txtCan3.Text.Length == 0 && txtCan3.Enabled == true))
                        {
                            MessageBox.Show("SI SELECCIONO UNA SEGUNDA ACTIVIDAD INGRESE LA CANTIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            txtCan3.Focus();
                        }
                        else
                        {
                            if ((txtPrecio_5.Text.Length == 0 && txtPrecio_5.Enabled == true))
                            {
                                MessageBox.Show("SI SELECCIONO QUE INCLUYE TRASLADO...INGRESE EL PRECIO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                txtPrecio_5.Focus();
                            }
                            else if ((txtCan5.Text.Length == 0 && txtCan5.Enabled == true))
                            {
                                MessageBox.Show("SI SELECCIONO QUE INCLUYE TRASLADO...INGRESE LA CANTIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                txtCan5.Focus();
                            }
                            else
                            {
                                if (decimal.Parse(txtTotalPagar.Text) == 0)
                                {
                                    MessageBox.Show("EL DOCUMENTO NO PUEDE SER CERO EN TOTAL A PAGAR...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                }
                                else
                                {
                                    if (cmdCondicion.Text.Contains("ACUENTA") && txtAcuenta.Text.Length == 0)
                                    {
                                        MessageBox.Show("SI SELECCIONO LA CONDICION ACUENTA, INGRESAR EL MONTO QUE LE DIO...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                        txtAcuenta.Focus();
                                    }
                                    else
                                    {
                                        if (cmdCondicion.Text.Contains("ACUENTA") && decimal.Parse(txtAcuenta.Text) <= 0)
                                        {
                                            MessageBox.Show("SI SELECCIONO LA CONDICION ACUENTA, EL MONTO NO PUEDE SER CERO...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                            txtAcuenta.SelectionStart = txtAcuenta.Text.Length;
                                            txtAcuenta.Focus();
                                        }
                                        else
                                        {
                                            if (validarAcuenta() == false)
                                            {
                                                MessageBox.Show("LA SUMA DEL ACUENTA CON EL EFECTIVO SUPERA AL MONTO TOTAL DE PAGO..!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                                            }
                                            else
                                            {
                                                if (!Val.IsMatch(txtHoraPar.Text))
                                                {
                                                    MessageBox.Show("INGRESE CORRECTAMENTE LA HORA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                                                    txtHoraPar.Focus();
                                                }
                                                else
                                                {
                                                    if (validarCantPax("uspValidarDisponibilidadG") == true)
                                                    {
                                                        guardar();
                                                    }
                                                    else
                                                    {
                                                        MessageBox.Show("YA SUPERO EL LIMITE DE PASAJEROS POR DIA, QUE ES DE (" + xCantMax + "), " +
                                                            "Y ACTUALMENTE TIENE OCUPADOS (" + xCanPax + ") FAVOR DE VERIFICAR OTRA FECHA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        public void editarA()
        {
            Stopwatch oReloj = new Stopwatch();
            oReloj.Start();
            total();
            crearCliente();

            decimal xacuenta = 0;
            decimal xEfectivo = 0;
            decimal xDeposito = 0;

            string vdata = string.Empty;
            decimal xcargos = 0;
            decimal xIGV = 0;

            decimal xSolExtra = 0;
            decimal xDolExtra = 0;

            
            string xidNota = lblIdNota.Text;

            string xIslas = string.Empty;
            string xTubulares = string.Empty;
            string xotros = string.Empty;

            xidNota = (lblIdNota.Text.Length == 0 || lblIdNota.Text == "") ? xidNota = "0" : xidNota = lblIdNota.Text;

            xacuenta = (txtAcuenta.Text.Length == 0) ? xacuenta = 0 : xacuenta = decimal.Parse(txtAcuenta.Text);
            xcargos = (txtCargos.Text.Length == 0) ? xcargos = 0 : xcargos = decimal.Parse(txtCargos.Text);
            xIGV = (txtIGV.Text.Length == 0) ? xIGV = 0 : xIGV = decimal.Parse(txtIGV.Text);
            xSolExtra = (txtExtraSol.Text.Length == 0) ? xSolExtra = 0 : xSolExtra = decimal.Parse(txtExtraSol.Text);
            xDolExtra = (txtExtraDol.Text.Length == 0) ? xDolExtra = 0 : xDolExtra = decimal.Parse(txtExtraDol.Text);
            xEfectivo = (txtefectivo.Text.Length == 0) ? xEfectivo = 0 : xEfectivo = decimal.Parse(txtefectivo.Text);
            xDeposito = (txtdeposito.Text.Length == 0) ? xDeposito = 0 : xDeposito = decimal.Parse(txtdeposito.Text);

            decimal xcantidad_1, xcantidad_2, xcantidad_3, xcantidad_4, xcantidad_5, xcantidad_6 = 0;
            decimal xPrecio_1, xPrecio_2, xPrecio_3, xPrecio_4, xPrecio_5, xPrecio_6 = 0;
            decimal xSubTotal_1, xSubTotal_2, xSubTotal_3, xSubTotal_4, xSubTotal_5, xSubTotal_6 = 0;

            xcantidad_1 = (txtCan1.Text.Length == 0) ? xcantidad_1 = 0 : xcantidad_1 = decimal.Parse(txtCan1.Text);
            xcantidad_2 = (txtCan2.Text.Length == 0) ? xcantidad_2 = 0 : xcantidad_2 = decimal.Parse(txtCan2.Text);
            xcantidad_3 = (txtCan3.Text.Length == 0) ? xcantidad_3 = 0 : xcantidad_3 = decimal.Parse(txtCan3.Text);
            xcantidad_4 = (txtCan4.Text.Length == 0) ? xcantidad_4 = 0 : xcantidad_4 = decimal.Parse(txtCan4.Text);
            xcantidad_5 = (txtCan5.Text.Length == 0) ? xcantidad_5 = 0 : xcantidad_5 = decimal.Parse(txtCan5.Text);
            xcantidad_6 = (txtCan6.Text.Length == 0) ? xcantidad_6 = 0 : xcantidad_6 = decimal.Parse(txtCan6.Text);

            xPrecio_1 = (txtPrecio_1.Text.Length == 0) ? xPrecio_1 = 0 : xPrecio_1 = decimal.Parse(txtPrecio_1.Text);
            xPrecio_2 = (txtPrecio_2.Text.Length == 0) ? xPrecio_2 = 0 : xPrecio_2 = decimal.Parse(txtPrecio_2.Text);
            xPrecio_3 = (txtPrecio_3.Text.Length == 0) ? xPrecio_3 = 0 : xPrecio_3 = decimal.Parse(txtPrecio_3.Text);
            xPrecio_4 = (txtPrecio_4.Text.Length == 0) ? xPrecio_4 = 0 : xPrecio_4 = decimal.Parse(txtPrecio_4.Text);
            xPrecio_5 = (txtPrecio_5.Text.Length == 0) ? xPrecio_5 = 0 : xPrecio_5 = decimal.Parse(txtPrecio_5.Text);
            xPrecio_6 = (txtPrecio_6.Text.Length == 0) ? xPrecio_6 = 0 : xPrecio_6 = decimal.Parse(txtPrecio_6.Text);

            xSubTotal_1 = (txtSubTotal_1.Text.Length == 0) ? xSubTotal_1 = 0 : xSubTotal_1 = decimal.Parse(txtSubTotal_1.Text);
            xSubTotal_2 = (txtSubTotal_2.Text.Length == 0) ? xSubTotal_2 = 0 : xSubTotal_2 = decimal.Parse(txtSubTotal_2.Text);
            xSubTotal_3 = (txtSubTotal_3.Text.Length == 0) ? xSubTotal_3 = 0 : xSubTotal_3 = decimal.Parse(txtSubTotal_3.Text);
            xSubTotal_4 = (txtSubTotal_4.Text.Length == 0) ? xSubTotal_4 = 0 : xSubTotal_4 = decimal.Parse(txtSubTotal_4.Text);
            xSubTotal_5 = (txtSubTotal_5.Text.Length == 0) ? xSubTotal_5 = 0 : xSubTotal_5 = decimal.Parse(txtSubTotal_5.Text);
            xSubTotal_6 = (txtSubTotal_6.Text.Length == 0) ? xSubTotal_6 = 0 : xSubTotal_6 = decimal.Parse(txtSubTotal_6.Text);

            if (cmdActividades.Text == "EXCURSIÓN ISLAS BALLESTAS" || cmdActividades.Text == "CUATRIMOTOS" || cmdActividades.Text == "CASTILLO DE CHANCAY")
            {
                xIslas = txtCan2.Text;
            }
            else
            {
                if (cmdActividades_2.Text == "EXCURSIÓN ISLAS BALLESTAS" || cmdActividades_2.Text == "CUATRIMOTOS" || cmdActividades_2.Text == "CASTILLO DE CHANCAY")
                {
                    xIslas = txtCan3.Text;
                }
                else
                {
                    if (cmdActividades_3.Text == "EXCURSIÓN ISLAS BALLESTAS" || cmdActividades_3.Text == "CUATRIMOTOS" || cmdActividades_3.Text == "CASTILLO DE CHANCAY")
                    {
                        xIslas = txtCan4.Text;
                    }
                }
            }

            if (cmdActividades.Text == "AVENTURA EN TUBULARES Y SANDBOARD" || cmdActividades.Text == "CANOPY" || cmdActividades.Text == "HACIENDA HUANDO")
            {
                xTubulares = txtCan2.Text;
            }
            else
            {
                if (cmdActividades_2.Text == "AVENTURA EN TUBULARES Y SANDBOARD" || cmdActividades_2.Text == "CANOPY" || cmdActividades_2.Text == "HACIENDA HUANDO")
                {
                    xTubulares = txtCan3.Text;
                }
                else
                {
                    if (cmdActividades_3.Text == "AVENTURA EN TUBULARES Y SANDBOARD" || cmdActividades_3.Text == "CANOPY" || cmdActividades_3.Text == "HACIENDA HUANDO")
                    {
                        xTubulares = txtCan4.Text;
                    }
                }
            }
            if (cmdActividades.Text == "RESERVA NACIONAL PARACAS" || cmdActividades.Text == "CANOTAJE" || cmdActividades.Text == "ECOTRULY PARK")
            {
                xotros = txtCan2.Text;
            }
            else
            {
                if (cmdActividades_2.Text == "RESERVA NACIONAL PARACAS" || cmdActividades_2.Text == "CANOTAJE" || cmdActividades_2.Text == "ECOTRULY PARK")
                {
                    xotros = txtCan3.Text;
                }
                else
                {
                    if (cmdActividades_3.Text == "RESERVA NACIONAL PARACAS" || cmdActividades_3.Text == "CANOTAJE" || cmdActividades_3.Text == "ECOTRULY PARK")
                    {
                        xotros = txtCan4.Text;
                    }
                }
            }

            string ximgPro = string.Empty;
            if (ximagen3.Image == null && imagecaptura.Image == null)
            {
                ximgPro = ImageNula.ToString();
            }
            else if (ximagen3.Image != null && imagecaptura.Image != null)
            {
                guardarImagen();
                ximgPro = txturl.Text;
            }
            else if (ximagen3.Image == null && imagecaptura.Image != null)
            {
                guardarImagen();
                ximgPro = txturl.Text;
            }
            else if (ximagen3.Image != null && imagecaptura.Image == null)
            {
                ximgPro = txtruta.Text;
            }
            txtruta.Text = ximgPro;
            vdata = cmdDocumento.Text + "|" +
            lblidCliente.Text + "|" +
            xUsuario.ToString() + "|" +
            cmdMedioPago.Text.Trim() + "|" +
            cmdCondicion.Text.Trim() + "|" +
            txtcelular.Text.Trim() + "|" +
            xTotalPri + "|" +
            xTotalPri + "|" +
            xacuenta.ToString() + "|" +
            decimal.Parse(txtSaldo.Text) + "|" +
            xcargos + "|" +
            decimal.Parse(txtTotalPagar.Text) +
            "|CANCELADO| " +
            xIdCompania.Trim() + "|" +
            cmdIgv.Text + "|" +
            txtSerie.Text.Trim() + "|" +
            txtnroDoc.Text.Trim() + "|" +
            "0.00|" +//Ganancia
            xIdUsuario + "|" +
            cmdEntidad.Text.Trim() + "|" + txtNroOperacion.Text.Trim() + "|";

            vdata += xEfectivo + "|" + xDeposito + "|";

            vdata +=
            cmdServicios.SelectedValue.ToString() + "|" +
            cmdAuxiliar.Text + "|" +
            txttelefono.Text.Trim() + "|" +
            int.Parse(txtCantPasajeros.Text) + "|" +
            cmdPartidas.Text + "|" +
            txtHoraPar.Text.Trim().ToUpper() + "|" +
            txtotroPuntoPartida.Text.Trim() + "|" +
            txtVisitasExcursion.Text.Trim() + "|" +
            xSolExtra + "|" +
            xDolExtra + "|" +
            dtimeFechaAdelanto.Value.ToString("MM-dd-yyyy") + "|" +
            lblMensaje.Text + "|" + txtObservaciones.Text.Trim() + "|" +
            xIslas + "|" + xTubulares + "|"+xotros+"|" +
            dtimeFechaViaje.Value.ToString("MM-dd-yyyy") + "|" +
            xIGV + "|" + cmdCargos.Text + "|" + lblIdNota.Text + "|" + xAviso + "|" +
            cmdmoneda.Text + "|" + cmdAlmuerzo.Text + "|" + 
            ximgPro+"|" + cmdHotel.Text +"|"+cmdRegion.Text+"[";

            vdata += xDetaId_1 + "|" + cmdAlmuerzo.Text + "|" + xPrecio_1 + "|" + xcantidad_1 + "|" + xSubTotal_1 + ";";
            vdata += xDetaId_2 + "|" + cmdActividades.Text + "|" + xPrecio_2 + "|" + xcantidad_2 + "|" + xSubTotal_2 + ";";
            vdata += xDetaId_3 + "|" + cmdActividades_2.Text + "|" + xPrecio_3 + "|" + xcantidad_3 + "|" + xSubTotal_3 + ";";
            vdata += xDetaId_4 + "|" + cmdActividades_3.Text + "|" + xPrecio_4 + "|" + xcantidad_4 + "|" + xSubTotal_4 + ";";
            vdata += xDetaId_5 + "|" + cmdTraslados.Text + "|" + xPrecio_5 + "|" + xcantidad_5 + "|" + xSubTotal_5 + ";";
            vdata += xDetaId_6 + "|" + txtEntradas.Text + "|" + xPrecio_6 + "|" + xcantidad_6 + "|" + xSubTotal_6;

            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("uspEditarViaje", "@ListaOrden", vdata);
            if (rpt == "")
            {
                men.ErrorGuardado();
            }
            else
            {
                if (rpt.Equals("false"))
                {
                    MessageBox.Show("No se Aperturo la caja chica...favor de abrir una nueva caja", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                else
                {
                    xAviso = 0;
                    listarFecha();
                    oReloj.Stop();
                    this.Text = ".:.TIEMPO DE RESPUESTA:  " + oReloj.Elapsed.TotalMilliseconds.ToString("N2") + " MS";
                    //men.GuardoCorrecto();
                    btnguardar.Enabled = false;
                    btneditar.Enabled = false;
                    btneliminar.Enabled = false;
                    btnactivar.Enabled = true;
                    desactivarCajas();
                    exportarPDF();
                    exportarDocumento();
                    btnpdf.Enabled = true;
                    btnPDF2.Enabled = true;
                }
            }
        }
        public void editar()
        {
            if (double.Parse(txtAcuenta.Text) < 0)
            {
                MessageBox.Show("EL DEPOSITO NO PUEDE SER MAYOR AL MONTO TOTAL DE PAGO..!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtdeposito.SelectionStart = txtdeposito.Text.Length;
                txtdeposito.Focus();
            }
            else if (txtNroOperacion.Enabled == true && txtNroOperacion.Text.Length == 0)
            {
                MessageBox.Show("SI EL PAGO ES CON DEPOSITO O TARJETA...INGRESE EL NRO DE OPERACION", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtNroOperacion.SelectionStart = txtNroOperacion.Text.Length;
                txtNroOperacion.Focus();
            }
            else
            {
                if ((cmdMedioPago.Text == "EFECTIVO" || cmdMedioPago.Text == "-"))
                {
                    editarA();
                }
                else
                {
                    editarA();
                    //if ((cmdMedioPago.Text != "EFECTIVO" || cmdMedioPago.Text != "-") && (imagecaptura.Image == null && ximagen3.Image == null && validaIP() == true))
                    //{
                    //    MessageBox.Show("SI EL PAGO ES CON DEPOSITO ADJUNTE LA IMAGEN DEL VOUCHER", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    //    btncargar.Focus();
                    //}
                    //else
                    //{
                    //}
                }
            }
        }
        //
        public string guardarImagen()
        {
            string xnombre = string.Empty;
            string xnombre2 = string.Empty;
            string xcarpeta = "FullDay\\BouchersPagos";
            string destino = string.Empty;
            destino = "\\\\" + xconexion.ServidorIP + "\\ArchivoSistema\\" + xcarpeta + "";
            DateTime xfecha = DateTime.Now;
            xnombre2 = string.Format("{0}-{1}-{2}-{3}-{4}-{5}-{6}",txtTotalPagar.Text, xfecha.Year, xfecha.Month, xfecha.Day, xfecha.Hour, xfecha.Minute, xfecha.Second);
            MD5 md5 = MD5.Create();
            byte[] imputBytes = System.Text.Encoding.ASCII.GetBytes(xnombre2);
            byte[] hash = md5.ComputeHash(imputBytes);
            xnombre2 = BitConverter.ToString(hash).Replace("-", "");
            xnombre = destino + "\\" + xnombre2 + ".jpeg";
            if (!Directory.Exists(destino))
            {
                Directory.CreateDirectory(destino);
                imagecaptura.Image.Save(xnombre, ImageFormat.Jpeg);
                txturl.Text = xnombre;
            }
            else
            {
                imagecaptura.Image.Save(xnombre, ImageFormat.Jpeg);
                txturl.Text = xnombre;
            }
            return xnombre;
        }
        public void eliminarImagen()
        {
            if (txtruta.Text.Length == 0 || txtruta.Text == ImageNula)
            {
                //
            }
            else
            {
                if (File.Exists(txtruta.Text))
                {
                    File.Delete(txtruta.Text);
                }
            }
        }
        //
        public void guardarA()
        {
            Stopwatch oReloj = new Stopwatch();
            oReloj.Start();
            total();
            crearCliente();
            string xObs = string.Empty;
            xObs = txtObservaciones.Text.Trim();
            decimal xEfectivo = 0;
            decimal xDeposito = 0;
            string xestado = string.Empty;
            string vdata = string.Empty;
            decimal xcargos = 0;
            decimal xIGV = 0;

            decimal xSolExtra = 0;
            decimal xDolExtra = 0;

            decimal xacuenta = 0;
            string xidNota = lblIdNota.Text;
            
            string xIslas = string.Empty;
            string xTubulares = string.Empty;
            string xotros = string.Empty;

            xidNota = (lblIdNota.Text.Length == 0 || lblIdNota.Text == "") ? xidNota = "0" : xidNota = lblIdNota.Text;

            xacuenta = (txtAcuenta.Text.Length == 0) ? xacuenta = 0 : xacuenta = decimal.Parse(txtAcuenta.Text);
            xcargos = (txtCargos.Text.Length == 0) ? xcargos = 0 : xcargos = decimal.Parse(txtCargos.Text);
            xIGV = (txtIGV.Text.Length == 0) ? xIGV = 0 : xIGV = decimal.Parse(txtIGV.Text);
            xSolExtra = (txtExtraSol.Text.Length == 0) ? xSolExtra = 0 : xSolExtra = decimal.Parse(txtExtraSol.Text);
            xDolExtra = (txtExtraDol.Text.Length == 0) ? xDolExtra = 0 : xDolExtra = decimal.Parse(txtExtraDol.Text);
            xEfectivo = (txtefectivo.Text.Length == 0) ? xEfectivo = 0 : xEfectivo = decimal.Parse(txtefectivo.Text);
            xDeposito = (txtdeposito.Text.Length == 0) ? xDeposito = 0 : xDeposito = decimal.Parse(txtdeposito.Text);

            decimal xcantidad_1, xcantidad_2, xcantidad_3, xcantidad_4, xcantidad_5, xcantidad_6 = 0;
            decimal xPrecio_1, xPrecio_2, xPrecio_3, xPrecio_4, xPrecio_5, xPrecio_6 = 0;
            decimal xSubTotal_1, xSubTotal_2, xSubTotal_3, xSubTotal_4, xSubTotal_5, xSubTotal_6 = 0;

            xcantidad_1 = (txtCan1.Text.Length == 0) ? xcantidad_1 = 0 : xcantidad_1 = decimal.Parse(txtCan1.Text);
            xcantidad_2 = (txtCan2.Text.Length == 0) ? xcantidad_2 = 0 : xcantidad_2 = decimal.Parse(txtCan2.Text);
            xcantidad_3 = (txtCan3.Text.Length == 0) ? xcantidad_3 = 0 : xcantidad_3 = decimal.Parse(txtCan3.Text);
            xcantidad_4 = (txtCan4.Text.Length == 0) ? xcantidad_4 = 0 : xcantidad_4 = decimal.Parse(txtCan4.Text);
            xcantidad_5 = (txtCan5.Text.Length == 0) ? xcantidad_5 = 0 : xcantidad_5 = decimal.Parse(txtCan5.Text);
            xcantidad_6 = (txtCan6.Text.Length == 0) ? xcantidad_6 = 0 : xcantidad_6 = decimal.Parse(txtCan6.Text);

            xPrecio_1 = (txtPrecio_1.Text.Length == 0) ? xPrecio_1 = 0 : xPrecio_1 = decimal.Parse(txtPrecio_1.Text);
            xPrecio_2 = (txtPrecio_2.Text.Length == 0) ? xPrecio_2 = 0 : xPrecio_2 = decimal.Parse(txtPrecio_2.Text);
            xPrecio_3 = (txtPrecio_3.Text.Length == 0) ? xPrecio_3 = 0 : xPrecio_3 = decimal.Parse(txtPrecio_3.Text);
            xPrecio_4 = (txtPrecio_4.Text.Length == 0) ? xPrecio_4 = 0 : xPrecio_4 = decimal.Parse(txtPrecio_4.Text);
            xPrecio_5 = (txtPrecio_5.Text.Length == 0) ? xPrecio_5 = 0 : xPrecio_5 = decimal.Parse(txtPrecio_5.Text);
            xPrecio_6 = (txtPrecio_6.Text.Length == 0) ? xPrecio_6 = 0 : xPrecio_6 = decimal.Parse(txtPrecio_6.Text);

            xSubTotal_1 = (txtSubTotal_1.Text.Length == 0) ? xSubTotal_1 = 0 : xSubTotal_1 = decimal.Parse(txtSubTotal_1.Text);
            xSubTotal_2 = (txtSubTotal_2.Text.Length == 0) ? xSubTotal_2 = 0 : xSubTotal_2 = decimal.Parse(txtSubTotal_2.Text);
            xSubTotal_3 = (txtSubTotal_3.Text.Length == 0) ? xSubTotal_3 = 0 : xSubTotal_3 = decimal.Parse(txtSubTotal_3.Text);
            xSubTotal_4 = (txtSubTotal_4.Text.Length == 0) ? xSubTotal_4 = 0 : xSubTotal_4 = decimal.Parse(txtSubTotal_4.Text);
            xSubTotal_5 = (txtSubTotal_5.Text.Length == 0) ? xSubTotal_5 = 0 : xSubTotal_5 = decimal.Parse(txtSubTotal_5.Text);
            xSubTotal_6 = (txtSubTotal_6.Text.Length == 0) ? xSubTotal_6 = 0 : xSubTotal_6 = decimal.Parse(txtSubTotal_6.Text);


            if (cmdActividades.Text == "EXCURSIÓN ISLAS BALLESTAS" || cmdActividades.Text == "CUATRIMOTOS" || cmdActividades.Text == "CASTILLO DE CHANCAY")
            {
                xIslas = txtCan2.Text;
            }
            else
            {
                if (cmdActividades_2.Text == "EXCURSIÓN ISLAS BALLESTAS" || cmdActividades_2.Text == "CUATRIMOTOS" || cmdActividades_2.Text == "CASTILLO DE CHANCAY")
                {
                    xIslas = txtCan3.Text;
                }
                else
                {
                    if (cmdActividades_3.Text == "EXCURSIÓN ISLAS BALLESTAS" || cmdActividades_3.Text == "CUATRIMOTOS" || cmdActividades_3.Text == "CASTILLO DE CHANCAY")
                    {
                        xIslas = txtCan4.Text;
                    }
                }
            }

            if (cmdActividades.Text == "AVENTURA EN TUBULARES Y SANDBOARD" || cmdActividades.Text == "CANOPY" || cmdActividades.Text == "HACIENDA HUANDO")
            {
                xTubulares = txtCan2.Text;
            }
            else
            {
                if (cmdActividades_2.Text == "AVENTURA EN TUBULARES Y SANDBOARD" || cmdActividades_2.Text == "CANOPY" || cmdActividades_2.Text == "HACIENDA HUANDO")
                {
                    xTubulares = txtCan3.Text;
                }
                else
                {
                    if (cmdActividades_3.Text == "AVENTURA EN TUBULARES Y SANDBOARD" || cmdActividades_3.Text == "CANOPY" || cmdActividades_3.Text == "HACIENDA HUANDO")
                    {
                        xTubulares = txtCan4.Text;
                    }
                }
            }
            if (cmdActividades.Text == "RESERVA NACIONAL PARACAS" || cmdActividades.Text == "CANOTAJE" || cmdActividades.Text == "ECOTRULY PARK")
            {
                xotros = txtCan2.Text;
            }
            else
            {
                if (cmdActividades_2.Text == "RESERVA NACIONAL PARACAS" || cmdActividades_2.Text == "CANOTAJE" || cmdActividades_2.Text == "ECOTRULY PARK")
                {
                    xotros = txtCan3.Text;
                }
                else
                {
                    if (cmdActividades_3.Text == "RESERVA NACIONAL PARACAS" || cmdActividades_3.Text == "CANOTAJE" || cmdActividades_3.Text == "ECOTRULY PARK")
                    {
                        xotros = txtCan4.Text;
                    }
                }
            }

            string ximgProducto = string.Empty;
            if (imagecaptura.Image == null)
            {
                ximgProducto = ImageNula.ToString();
                txtruta.Text = ImageNula.ToString();
            }
            else
            {
                guardarImagen();
                ximgProducto = txturl.Text;
                txtruta.Text = txturl.ToString();
            }
            vdata = cmdDocumento.Text + "|" +
            lblidCliente.Text + "|" +
            xUsuario.ToString() + "|" +
            cmdMedioPago.Text.Trim() + "|" +
            cmdCondicion.Text.Trim() + "|" +
            txtcelular.Text.Trim() + "|" +
            xTotalPri + "|" +
            xTotalPri + "|" +
            xacuenta.ToString() + "|" +
            decimal.Parse(txtSaldo.Text) + "|" +
            xcargos + "|" +
            decimal.Parse(txtTotalPagar.Text) +
            "|CANCELADO|" +
            xIdCompania.Trim() + "|" +
            cmdIgv.Text + "|" +
            txtSerie.Text.Trim() + "|" +
            txtnroDoc.Text.Trim() + "|" +
            "0.00|" +
            xIdUsuario + "|" +
            cmdEntidad.Text.Trim() + "|" + txtNroOperacion.Text.Trim() + "|";

            vdata += xEfectivo + "|" + xDeposito + "|";

            vdata +=
            cmdServicios.SelectedValue.ToString() + "|" +
            cmdAuxiliar.Text + "|" +
            txttelefono.Text.Trim() + "|" +
            int.Parse(txtCantPasajeros.Text) + "|" +
            cmdPartidas.Text + "|" +
            txtHoraPar.Text.Trim().ToUpper() + "|" +
            txtotroPuntoPartida.Text.Trim() + "|" +
            txtVisitasExcursion.Text.Trim() + "|" +
            xSolExtra + "|" +
            xDolExtra + "|" +
            dtimeFechaAdelanto.Value.ToString("MM-dd-yyyy") + "|" +
            lblMensaje.Text + "|" + xObs + "|" +
            xIslas + "|" + xTubulares + "|"+xotros+"|" +
            dtimeFechaViaje.Value.ToString("MM-dd-yyyy") + "|" +
            xIGV + "|" + cmdCargos.Text.Trim() + "|" + cmdmoneda.Text + "|" + cmdAlmuerzo.Text + "|" + 
            ximgProducto +"|"+cmdHotel.Text+"|"+cmdRegion.Text+"[";

            vdata += cmdAlmuerzo.Text.Trim() + "|" + xPrecio_1 + "|" + xcantidad_1 + "|" + xSubTotal_1 + ";";
            vdata += cmdActividades.Text + "|" + xPrecio_2 + "|" + xcantidad_2 + "|" + xSubTotal_2 + ";";
            vdata += cmdActividades_2.Text + "|" + xPrecio_3 + "|" + xcantidad_3 + "|" + xSubTotal_3 + ";";
            vdata += cmdActividades_3.Text + "|" + xPrecio_4 + "|" + xcantidad_4 + "|" + xSubTotal_4 + ";";
            vdata += cmdTraslados.Text.Trim() + "|" + xPrecio_5 + "|" + xcantidad_5 + "|" + xSubTotal_5 + ";";
            vdata += txtEntradas.Text + "|" + xPrecio_6 + "|" + xcantidad_6 + "|" + xSubTotal_6;

            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("uspinsertarViaje", "@ListaOrden", vdata);
            if (rpt == "")
            {
                men.ErrorGuardado();
            }
            else
            {
                if (rpt.Equals("false"))
                {
                    MessageBox.Show("No se Aperturo la caja chica...favor de abrir una nueva caja", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                else if (rpt.Equals("OPERACION"))
                {
                    MessageBox.Show("El Numero de Operacion que ingreso ya existe..favor de verificar el numero", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtNroOperacion.SelectionStart = txtNroOperacion.Text.Length;
                    txtNroOperacion.Focus();
                }
                else
                {
                    string[] xinfo = rpt.Split('¬');
                    lblIdNota.Text = "";
                    txtnroDoc.Text = "";
                    lblIdNota.Text = xinfo[0];
                    txtSerie.Text = xinfo[1];
                    txtnroDoc.Text = xinfo[2];
                    txtregistro.Text = xinfo[3];
                    txtcliente.AutoCompleteCustomSource = AutoCompleClass.Autocomplete();
                    listar();
                    oReloj.Stop();
                    this.Text = ".:.TIEMPO DE RESPUESTA:  " + oReloj.Elapsed.TotalMilliseconds.ToString("N2") + " MS";
                    //men.GuardoCorrecto();
                    btnguardar.Enabled = false;
                    btneditar.Enabled = false;
                    btneliminar.Enabled = false;
                    btnactivar.Enabled = true;
                    desactivarCajas();
                    exportarPDF();
                    exportarDocumento();
                    btnpdf.Enabled = true;
                    btnPDF2.Enabled = true;
                }
            }
        }
        public void guardar()
        {
            if (double.Parse(txtAcuenta.Text) < 0)
            {
                MessageBox.Show("EL DEPOSITO NO PUEDE SER MAYOR AL MONTO TOTAL DE PAGO..!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtdeposito.SelectionStart = txtdeposito.Text.Length;
                txtdeposito.Focus();
            }
            else if (txtNroOperacion.Enabled == true && txtNroOperacion.Text.Length == 0)
            {
                MessageBox.Show("SI EL PAGO ES CON DEPOSITO O TARJETA...INGRESE EL NRO DE OPERACION", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtNroOperacion.SelectionStart = txtNroOperacion.Text.Length;
                txtNroOperacion.Focus();
            }
            else
            {
                if ((cmdMedioPago.Text == "EFECTIVO" || cmdMedioPago.Text == "-"))
                {
                    guardarA();
                }
                else
                {
                    //if ((cmdMedioPago.Text != "EFECTIVO" || cmdMedioPago.Text != "-") && (imagecaptura.Image == null && validaIP() == true))
                    //{
                    //    MessageBox.Show("SI EL PAGO ES CON DEPOSITO ADJUNTE LA IMAGEN DEL VOUCHER", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    //    btncargar.Focus();
                    //}
                    //else
                    //{
                        guardarA();
                    //}
                }
            }
        }
        #endregion
        public void total()
        {
            xTotalPri = 0;

            //decimal xtotal = 0;
            double xsub1 = 0;
            double xsub2 = 0;
            double xsub3 = 0;
            double xsub4 = 0;
            double xsub5 = 0;
            double xsub6 = 0;

            double xPagar = 0;
            double xSaldo = 0;
            double xAcuenta = 0;
            double vtotal = 0;

            xsub1 = (txtSubTotal_1.Text.Length == 0) ? 0 : double.Parse(txtSubTotal_1.Text);
            xsub2 = (txtSubTotal_2.Text.Length == 0) ? 0 : double.Parse(txtSubTotal_2.Text);
            xsub3 = (txtSubTotal_3.Text.Length == 0) ? 0 : double.Parse(txtSubTotal_3.Text);
            xsub4 = (txtSubTotal_4.Text.Length == 0) ? 0 : double.Parse(txtSubTotal_4.Text);
            xsub5 = (txtSubTotal_5.Text.Length == 0) ? 0 : double.Parse(txtSubTotal_5.Text);
            xsub6 = (txtSubTotal_6.Text.Length == 0) ? 0 : double.Parse(txtSubTotal_6.Text);

            vtotal = (xsub1 + xsub2 + xsub3 + xsub4 + xsub5 + xsub6);
            xTotalPri = vtotal;
            xPagar = vtotal + calcularIgv() + calcularVisa();
            xPagar = Math.Round(xPagar, 2);

            if (cmdCondicion.Text.Equals("CANCELADO") || cmdCondicion.Text.Equals("(SELECCIONE)"))
            {
                xAcuenta = xPagar;
                txtAcuenta.Text = xPagar.ToString("N2");
            }
            else if (cmdCondicion.Text.Equals("CREDITO"))
            {
                xAcuenta = 0;
                txtAcuenta.Text = "0.00";
                txtdeposito.Text = "";
                txtefectivo.Text = "";
            }
            else
            {
                xAcuenta = (txtAcuenta.Text.Length == 0) ? 0 : double.Parse(txtAcuenta.Text);
            }

            double xExtraA = 0;
            string xTextoMoneda = string.Empty;
            double xOtraExtra = 0;
            string xMonExtra = string.Empty;
            if (cmdmoneda.Text == "SOLES")
            {
                xExtraA = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xTextoMoneda = "S/ ";
                xOtraExtra = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xMonExtra = "$ ";
            }
            else
            {
                xExtraA = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xTextoMoneda = "$ ";
                xOtraExtra = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xMonExtra = "S/ ";
            }
            xSaldo = xPagar - double.Parse(xAcuenta.ToString());
            xSaldo = xSaldo + xExtraA;

            txtTotalPagar.Text = xPagar.ToString("N2");
            txtSaldo.Text = xSaldo.ToString("N2");
            if (cmdMedioPago.Text == "EFECTIVO" || cmdMedioPago.Text == "-" || cmdMedioPago.Text == "(SELECCIONE)")
            {
                txtdeposito.Text = "0.00";
                txtefectivo.Text = txtAcuenta.Text;
            }
            else
            {
                if (cmdMedioPago.Text == "DEPOSITO" || cmdMedioPago.Text == "YAPE" || cmdMedioPago.Text == "PLIN")
                {
                    txtdeposito.Text = txtAcuenta.Text;
                    txtefectivo.Text = "0.00";
                }
                else
                {
                    //txtdeposito.Text ="";
                    //txtefectivo.Text = "";
                }
            }
            if (xSaldo > 0)
            {
                ximagen.BackColor = Color.FromArgb(192, 0, 0);
                lblMensaje.BackColor = Color.FromArgb(192, 0, 0);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text;
                }
                else
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
            else
            {
                ximagen.BackColor = Color.FromArgb(48, 84, 150);
                lblMensaje.BackColor = Color.FromArgb(48, 84, 150);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda";
                }
                else
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda" + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
        }
        public void traerHoPa()
        {
            if (cmdRegion.Text == "(SELECCIONE)")
            {
                men.SeleccioneUnDato();
            }
            else
            {
                traerHoteles();
                //traerPartidas();
            }
        }
        public void traerHoteles()
        {
            /////Hoteles
            cmdHotel.DataSource = null;

            string xRegion = cmdRegion.Text;

            string[] registrosH = xlistas[12].Split('¬');
            int nRegistrosH = registrosH.Length;
            string[] camposH;

            string xvaloresH = string.Empty;
            for (int i = 0; i < nRegistrosH; i++)
            {
                camposH = registrosH[i].Split('|');
                if (camposH[0] == "~") break;
                else
                {
                    if (xRegion == camposH[2])
                    {
                        xvaloresH += camposH[0] + "|" + camposH[1] + "¬";
                    }
                }
            }
            if (xvaloresH.Length > 0)
            {
                xvaloresH = xvaloresH.Substring(0, xvaloresH.Length - 1);
                listaHoteles = Cadena.AlistaCampoVacio(xvaloresH);
                cmdHotel.DataSource = listaHoteles;
                cmdHotel.DisplayMember = "Nombre";
                cmdHotel.ValueMember = "Codigo";
            }
        }
        public void traerPartidas()
        {
            cmdPartidas.DataSource = null;
            string[] registrosP = xlistas[4].Split('¬');
            int nRegistrosP = registrosP.Length;
            string[] camposP;

            string xvalores = string.Empty;

            string xRegion = cmdServicios.SelectedValue.ToString();

            for (int i = 0; i < nRegistrosP; i++)
            {
                camposP = registrosP[i].Split('|');
                if (camposP[0] == "~") break;
                else
                {
                    if (xRegion== camposP[2])
                    {
                        xvalores += camposP[0] + "|" + camposP[1] + "¬";
                    }
                }
            }
            if (xvalores.Length > 0)
            {
                xvalores = xvalores.Substring(0, xvalores.Length - 1);
                listaPartidas = Cadena.AlistaCampoSelectH_O(xvalores);
                cmdPartidas.DataSource = listaPartidas;
                cmdPartidas.DisplayMember = "Nombre";
                cmdPartidas.ValueMember = "Codigo";
            }
        }
        //
        public void traerServiciosB(string xnomAuxi)
        {
            string[] vlistas;
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("usptraerServiciosB");
            if (!string.IsNullOrEmpty(rpt))
            {
                cmdAuxiliar.DataSource = null;
                vlistas = rpt.Split('[');
                listaAuxiliar = Cadena.AlistaCampoSelect(vlistas[0]);
                cmdAuxiliar.DataSource = listaAuxiliar;
                cmdAuxiliar.DisplayMember = "Nombre";
                cmdAuxiliar.ValueMember = "Codigo";

                xlistas[5] = null;
                xlistas[5] = vlistas[1];
                if (xnomAuxi.Length > 0)
                {
                    cmdAuxiliar.Text = xnomAuxi;
                    traerTelefono(xlistas[5]);
                }
                else
                {
                    txttelefono.Text = "";
                }
            }
        }
        //
        public void traerServicios()
        {
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("usptraerServicios");
            if (!string.IsNullOrEmpty(rpt))
            {
                xlistas = rpt.Split('[');
                listaServicios = Cadena.AlistaCampoSelect(xlistas[0]);
                cmdServicios.DataSource = listaServicios;
                cmdServicios.DisplayMember = "Nombre";
                cmdServicios.ValueMember = "Codigo";

                listaServiciosAG = Cadena.AlistaCampoSelect(xlistas[0]);
                cmdServiciosAG.DataSource = listaServiciosAG;
                cmdServiciosAG.DisplayMember = "Nombre";
                cmdServiciosAG.ValueMember = "Codigo";


                listaAuxiliar = Cadena.AlistaCampoSelect(xlistas[2]);
                cmdAuxiliar.DataSource = listaAuxiliar;
                cmdAuxiliar.DisplayMember = "Nombre";
                cmdAuxiliar.ValueMember = "Codigo";

                listaAlmuerzo= Cadena.AlistaCampoSelect(xlistas[8]);
                cmdAlmuerzo.DataSource = listaAlmuerzo;
                cmdAlmuerzo.DisplayMember = "Nombre";
                cmdAlmuerzo.ValueMember = "Codigo";

                listaTraslado= Cadena.AlistaCampoSelect(xlistas[9]);
                cmdTraslados.DataSource = listaTraslado;
                cmdTraslados.DisplayMember = "Nombre";
                cmdTraslados.ValueMember = "Codigo";

                listaRegiones = Cadena.AlistaCampoSelect(xlistas[14]);
                cmdRegion.DataSource = listaRegiones;
                cmdRegion.DisplayMember = "Nombre";
                cmdRegion.ValueMember = "Codigo";
            }
        }
        public void traerVisitas(string data)
        {
            if (cmdServicios.SelectedValue.ToString() != "0")
            {
                xPrecioTours = 0;
                string[] registros = data.Split('¬');
                int nRegistros = registros.Length;
                string[] campos;
                var idCabezera = cmdServicios.SelectedValue.ToString();
                //var idCabR = xRegion;
                for (int i = 0; i < nRegistros; i++)
                {
                    campos = registros[i].Split('|');
                    if (campos[0] == "~") break;
                    else
                    {
                        if (idCabezera == campos[0])
                        {
                            if (cmdmoneda.Text == "DOLARES")
                            {
                                xPrecioTours = decimal.Parse(campos[1]);
                                txtPrecio_1.Text = campos[1];
                            }
                            else
                            {
                                xPrecioTours = decimal.Parse(campos[3]);
                                txtPrecio_1.Text = campos[3];
                            }
                            txtVisitasExcursion.Text = campos[2];
                            dtimeFechaViaje.Focus();
                            break;
                        }
                    }
                }
                if (xflacMon == 0)
                {
                    cmdActividades.DataSource = null;
                    cmdActividades_2.DataSource = null;
                    cmdActividades_3.DataSource = null;

                    string[] registrosA = xlistas[3].Split('¬');
                    int nRegistrosA = registrosA.Length;
                    string[] camposA;

                    string xvaloresA = string.Empty;

                    for (int i = 0; i < nRegistrosA; i++)
                    {
                        camposA = registrosA[i].Split('|');
                        if (camposA[0] == "~")
                        {
                            break;
                        }
                        else
                        {
                            if (idCabezera == camposA[2])
                            {
                                xvaloresA += camposA[0] + "|" + camposA[1] + "¬";
                            }
                        }
                    }
                    if (xvaloresA.Length > 0)
                    {
                        xvaloresA = xvaloresA.Substring(0, xvaloresA.Length - 1);

                        listaActividades = Cadena.AlistaCampoVacio(xvaloresA);
                        cmdActividades.DataSource = listaActividades;
                        cmdActividades.DisplayMember = "Nombre";
                        cmdActividades.ValueMember = "Codigo";

                        listaActividades = Cadena.AlistaCampoVacio(xvaloresA);
                        cmdActividades_2.DataSource = listaActividades;
                        cmdActividades_2.DisplayMember = "Nombre";
                        cmdActividades_2.ValueMember = "Codigo";

                        listaActividades = Cadena.AlistaCampoVacio(xvaloresA);
                        cmdActividades_3.DataSource = listaActividades;
                        cmdActividades_3.DisplayMember = "Nombre";
                        cmdActividades_3.ValueMember = "Codigo";
                    }
                    else
                    {
                        List<EGeneral> lista = null;
                        lista=new List<EGeneral>();
                        lista.Add(new EGeneral { Codigo = "0", Nombre = "-" });

                        listaActividades = lista;
                        cmdActividades.DataSource = listaActividades;
                        cmdActividades.DisplayMember = "Nombre";
                        cmdActividades.ValueMember = "Codigo";

                        listaActividades =lista;
                        cmdActividades_2.DataSource = listaActividades;
                        cmdActividades_2.DisplayMember = "Nombre";
                        cmdActividades_2.ValueMember = "Codigo";

                        listaActividades =lista;
                        cmdActividades_3.DataSource = listaActividades;
                        cmdActividades_3.DisplayMember = "Nombre";
                        cmdActividades_3.ValueMember = "Codigo";
                    }
                }
                traerHoPa();
                traerPartidas();
            }
            else
            {
                xPrecioTours = 0;
                txtVisitasExcursion.Text = "";
                txtPrecio_1.Text = "";
                men.SeleccioneUnDato();
            }
        }
        public void traerTelefono(string data)
        {
            if (cmdAuxiliar.SelectedValue.ToString() != "0")
            {
                string[] registros = data.Split('¬');
                int nRegistros = registros.Length;
                string[] campos;
                var idCabezera = cmdAuxiliar.SelectedValue.ToString();
                for (int i = 0; i < nRegistros; i++)
                {
                    campos = registros[i].Split('|');
                    if (campos[0] == "~") break;
                    else
                    {
                        if (idCabezera == campos[0])
                        {
                            txttelefono.Text = campos[1];
                            break;
                        }
                    }
                }
                txttelefono.SelectionStart = txttelefono.Text.Length;
                txttelefono.Focus();
            }
            else
            {
                txttelefono.Text = "";
                men.SeleccioneUnDato();
            }
        }
        public void traerHora(string data)
        {
            if (cmdPartidas.SelectedValue.ToString() != "0")
            {
                string[] registros = data.Split('¬');
                int nRegistros = registros.Length;
                string[] campos;
                var idCabezera = cmdPartidas.SelectedValue.ToString();
                for (int i = 0; i < nRegistros; i++)
                {
                    campos = registros[i].Split('|');
                    if (campos[0] == "~") break;
                    else
                    {
                        if (idCabezera == campos[0])
                        {
                            txtHoraPar.Text = campos[1];
                            break;
                        }
                    }
                }

                if (cmdPartidas.Text.Equals("HOTEL") || cmdPartidas.Text.Equals("OTROS"))
                {
                    txtHoraPar.Text = "";
                    cmdTraslados.Enabled = true;
                    cmdTraslados.Text = "(SELECCIONE)";
                    cmdHotel.Text = "-";
                    cmdHotel.Enabled = true;
                    cmdHotel.Focus();
                }
                else
                {
                    cmdTraslados.Enabled = false;
                    cmdTraslados.Text = "-";
                    txtHoraPar.SelectionStart = txtHoraPar.Text.Length;
                    cmdHotel.Text = "-";
                    cmdHotel.Enabled = false;
                    txtHoraPar.Focus();
                }
                txtPrecio_5.Enabled = false;
                txtCan5.Enabled = false;
                txtPrecio_5.Text = "";
                txtCan5.Text = "";
                txtSubTotal_5.Text = "";
                txtotroPuntoPartida.Text = "";
                cmdHotel.Text = "-";
            }
            else
            {
                txtHoraPar.Text = "";
                men.SeleccioneUnDato();
            }
        }

        public void limpiaFila2()
        {
            xflac = 1;
            if (cmdActividades.SelectedValue.ToString() == "0" &&
                cmdActividades_2.SelectedValue.ToString() == "0" &&
                cmdActividades_3.SelectedValue.ToString() == "0")
            {
                txtPrecio_6.Text = "";
                txtCan6.Text = "";
                txtEntradas.Text = "N/A";
                txtSubTotal_6.Text = "";
            }
            else
            {
                if ((cmdActividades_2.SelectedValue.ToString() != "1" &&
                    cmdActividades_3.SelectedValue.ToString() != "1" ))
                {
                    txtPrecio_6.Text = "";
                    txtCan6.Text = "";
                    txtEntradas.Text = "N/A";
                    txtSubTotal_6.Text = "";
                }
            }
            txtPrecio_2.Enabled = false;
            txtCan2.Enabled = false;
            txtPrecio_2.Text = "";
            txtCan2.Text = "";
            txtSubTotal_2.Text = "";
            total();
        }
        public void limpiaFila3()
        {
            xflac = 1;
            if (cmdActividades.SelectedValue.ToString() == "0" &&
                cmdActividades_2.SelectedValue.ToString() == "0" &&
                cmdActividades_3.SelectedValue.ToString() == "0")
            {
                txtPrecio_6.Text = "";
                txtCan6.Text = "";
                txtEntradas.Text = "N/A";
                txtSubTotal_6.Text = "";
            }
            else
            {

                if ((cmdActividades.SelectedValue.ToString() != "1" &&
                    cmdActividades_3.SelectedValue.ToString() != "1"))
                {
                    txtPrecio_6.Text = "";
                    txtCan6.Text = "";
                    txtEntradas.Text = "N/A";
                    txtSubTotal_6.Text = "";
                }
            }
            txtPrecio_3.Enabled = false;
            txtCan3.Enabled = false;
            txtPrecio_3.Text = "";
            txtCan3.Text = "";
            txtSubTotal_3.Text = "";
            total();
        }
        //
        public void limpiaFila4()
        {
            xflac = 1;
            if (cmdActividades.SelectedValue.ToString() == "0" &&
                cmdActividades_2.SelectedValue.ToString() == "0" &&
                cmdActividades_3.SelectedValue.ToString() == "0")
            {
                txtPrecio_6.Text = "";
                txtCan6.Text = "";
                txtEntradas.Text = "N/A";
                txtSubTotal_6.Text = "";
            }
            else
            {
                if ((cmdActividades.SelectedValue.ToString() != "1") &&
                cmdActividades_2.SelectedValue.ToString() != "1")
                {
                    txtPrecio_6.Text = "";
                    txtCan6.Text = "";
                    txtEntradas.Text = "N/A";
                    txtSubTotal_6.Text = "";
                }
            }
            txtPrecio_4.Enabled = false;
            txtCan4.Enabled = false;
            txtPrecio_4.Text = "";
            txtCan4.Text = "";
            txtSubTotal_4.Text = "";
            total();
        }
        //
        public void traerPrecio(string data)
        {
            xflac = 1;
            if (cmdActividades.SelectedValue.ToString() != "0")
            {
                if (txtCantPasajeros.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE PRIMERO LA CANTIDAD DE PASAJEROS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtCantPasajeros.Focus();
                    cmdActividades.Text = "-";
                }
                else
                {
                    txtSubTotal_2.Text = "";
                    string[] registros = data.Split('¬');
                    int nRegistros = registros.Length;
                    string[] campos;
                    decimal xprecio = 0;
                    decimal xentrada = 0;
                    var idCabezera = cmdActividades.SelectedValue.ToString();
                    for (int i = 0; i < nRegistros; i++)
                    {
                        campos = registros[i].Split('|');
                        if (campos[0] == "~") break;
                        else
                        {
                            if (idCabezera == campos[0])
                            {
                                xprecio = (cmdmoneda.Text == "SOLES") ? decimal.Parse(campos[1]) : decimal.Parse(campos[3]);
                                xentrada = (cmdmoneda.Text == "SOLES") ? decimal.Parse(campos[2]) : decimal.Parse(campos[4]);

                                //xprecio = decimal.Parse(campos[1]);
                                //xentrada = decimal.Parse(campos[2]);

                                if (cmdActividades.Text.Equals("EXCURSIÓN ISLAS BALLESTAS"))
                                {
                                    txtPrecio_2.Text = "";
                                    txtCan2.Text = txtCantPasajeros.Text;
                                    txtPrecio_6.Text = xentrada.ToString("N2");
                                    txtCan6.Text = txtCantPasajeros.Text;
                                    txtEntradas.Text = "Imptos de Islas + Muelle";
                                    txtSubTotal_6.Text = (decimal.Parse(txtCan6.Text) * xentrada).ToString("N2");
                                    txtPrecio_2.Enabled = false;
                                    txtCan2.Enabled = true;
                                }
                                else
                                {
                                    txtPrecio_2.Text = xprecio.ToString("N2");
                                    txtCan2.Text = txtCantPasajeros.Text;
                                    txtSubTotal_2.Text = (decimal.Parse(txtCan2.Text) * xprecio).ToString("N2");

                                    if ((cmdActividades.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") || 
                                        cmdActividades_2.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") ||
                                        cmdActividades_3.Text.Equals("EXCURSIÓN ISLAS BALLESTAS")) && 
                                        txtPrecio_6.Text.Length > 0)
                                    {
                                        //
                                    }
                                    else
                                    {
                                        txtPrecio_6.Text = "";
                                        txtCan6.Text = "";
                                        txtEntradas.Text = "N/A";
                                        txtSubTotal_6.Text = "";
                                    }
                                    txtPrecio_2.Enabled = true;
                                    txtCan2.Enabled = true;
                                }
                                break;
                            }
                        }
                    }
                    txtCan2.SelectionStart = txtCan2.Text.Length;
                    txtCan2.Focus();
                }
            }
            else
            {
                limpiaFila2();
            }
            total();
        }
        /*PRECIO B*/
        public void traerPrecio2(string data)
        {
            xflac = 1;
            if (cmdActividades_2.SelectedValue.ToString() != "0")
            {
                if (txtCantPasajeros.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE PRIMERO LA CANTIDAD DE PASAJEROS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtCantPasajeros.Focus();
                    cmdActividades_2.Text = "-";
                }
                else
                {
                    txtSubTotal_3.Text = "";
                    string[] registros = data.Split('¬');
                    int nRegistros = registros.Length;
                    string[] campos;
                    decimal xprecio = 0;
                    decimal xentrada = 0;
                    var idCabezera = cmdActividades_2.SelectedValue.ToString();
                    for (int i = 0; i < nRegistros; i++)
                    {
                        campos = registros[i].Split('|');
                        if (campos[0] == "~") break;
                        else
                        {
                            if (idCabezera == campos[0])
                            {
                                xprecio = (cmdmoneda.Text == "SOLES") ? decimal.Parse(campos[1]) : decimal.Parse(campos[3]);
                                xentrada = (cmdmoneda.Text == "SOLES") ? decimal.Parse(campos[2]) : decimal.Parse(campos[4]);
                                //xprecio = decimal.Parse(campos[1]);
                                //xentrada = decimal.Parse(campos[2]);

                                if (cmdActividades_2.Text.Contains("EXCURSIÓN ISLAS BALLESTAS"))
                                {
                                    txtPrecio_3.Text = "";
                                    txtCan3.Text = txtCantPasajeros.Text;
                                    txtPrecio_6.Text = xentrada.ToString("N2");
                                    txtCan6.Text = txtCantPasajeros.Text;
                                    txtEntradas.Text = "Imptos de Islas + Muelle";
                                    txtSubTotal_6.Text = (decimal.Parse(txtCan6.Text) * xentrada).ToString("N2");
                                    txtPrecio_3.Enabled = false;
                                    txtCan3.Enabled = true;
                                }
                                else
                                {

                                    txtPrecio_3.Text = xprecio.ToString("N2");
                                    txtCan3.Text = txtCantPasajeros.Text;
                                    txtSubTotal_3.Text = (decimal.Parse(txtCan3.Text) * xprecio).ToString("N2");

                                    if ((cmdActividades.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") || 
                                        cmdActividades_2.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") ||
                                         cmdActividades_3.Text.Equals("EXCURSIÓN ISLAS BALLESTAS")) 
                                         && txtPrecio_6.Text.Length > 0)
                                    {
                                        //
                                    }
                                    else
                                    {
                                        txtPrecio_6.Text = "";
                                        txtCan6.Text = "";
                                        txtEntradas.Text = "N/A";
                                        txtSubTotal_6.Text = "";
                                    }

                                    txtPrecio_3.Enabled = true;
                                    txtCan3.Enabled = true;
                                }
                                break;
                            }
                        }
                    }
                    txtCan3.SelectionStart = txtCan3.Text.Length;
                    txtCan3.Focus();
                }
            }
            else
            {
                limpiaFila3();
            }
            total();
        }
        /*
         */

        /*PRECIO B*/
        public void traerPrecio3(string data)
        {
            xflac = 1;
            if (cmdActividades_3.SelectedValue.ToString() != "0")
            {
                if (txtCantPasajeros.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE PRIMERO LA CANTIDAD DE PASAJEROS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtCantPasajeros.Focus();
                    cmdActividades_3.Text = "-";
                }
                else
                {
                    txtSubTotal_4.Text = "";
                    string[] registros = data.Split('¬');
                    int nRegistros = registros.Length;
                    string[] campos;
                    decimal xprecio = 0;
                    decimal xentrada = 0;
                    var idCabezera = cmdActividades_3.SelectedValue.ToString();
                    for (int i = 0; i < nRegistros; i++)
                    {
                        campos = registros[i].Split('|');
                        if (campos[0] == "~") break;
                        else
                        {
                            if (idCabezera == campos[0])
                            {
                                xprecio = (cmdmoneda.Text == "SOLES") ? decimal.Parse(campos[1]) : decimal.Parse(campos[3]);
                                xentrada = (cmdmoneda.Text == "SOLES") ? decimal.Parse(campos[2]) : decimal.Parse(campos[4]);
                                //xprecio = decimal.Parse(campos[1]);
                                //xentrada = decimal.Parse(campos[2]);

                                if (cmdActividades_3.Text.Equals("EXCURSIÓN ISLAS BALLESTAS"))
                                {
                                    txtPrecio_4.Text = "";
                                    txtCan4.Text = txtCantPasajeros.Text;
                                    txtPrecio_6.Text = xentrada.ToString("N2");
                                    txtCan6.Text = txtCantPasajeros.Text;
                                    txtEntradas.Text = "Imptos de Islas + Muelle";
                                    txtSubTotal_6.Text = (decimal.Parse(txtCan6.Text) * xentrada).ToString("N2");
                                    txtPrecio_4.Enabled = false;
                                    txtCan4.Enabled = true;
                                }
                                else
                                {

                                    txtPrecio_4.Text = xprecio.ToString("N2");
                                    txtCan4.Text = txtCantPasajeros.Text;
                                    txtSubTotal_4.Text = (decimal.Parse(txtCan4.Text) * xprecio).ToString("N2");

                                    if (cmdActividades_3.SelectedValue.ToString() != "0" && txtPrecio_6.Text.Length > 0)
                                    {
                                        //
                                    }
                                    else
                                    {
                                        txtPrecio_6.Text = "";
                                        txtCan6.Text = "";
                                        txtEntradas.Text = "N/A";
                                        txtSubTotal_6.Text = "";
                                    }

                                    txtPrecio_4.Enabled = true;
                                    txtCan4.Enabled = true;
                                }
                                break;
                            }
                        }
                    }
                    txtCan4.SelectionStart = txtCan4.Text.Length;
                    txtCan4.Focus();
                }
            }
            else
            {
                limpiaFila3();
            }
            total();
        }
        /*
         */
        //*
        public void limpiar()
        {
            xSaldo_Fijo = 0;
            xEfec_Fijo = 0;
            xDepo_Fijo = 0;
            lblEfectivoSol.Text = "0.00";
            lblDepositoSol.Text = "0.00";
            lbltotalSol.Text = "0.00";

            lblefecDolar.Text = "0.00";
            lblDepoDolar.Text = "0.00";
            lblTotalDolarLQ.Text = "0.00";

            xRegion = string.Empty;
            xCantMax = string.Empty;
            xCanPax = string.Empty;
            xAviso = 0;
            xtotalEnAl = 0;
            xflacMon = 0;
            lblDisponible.Text = "0";
            lblTextDis.Visible = false;
            lblDisponible.Visible = false;
            lblTextoPagar.Text = "TOTAL A PAGAR S/ :";
            lblTextoSaldo.Text = "SALDO S/ :";
            lblDepositoTexto.Text = "Deposito S/";
            btnAbrirImg.Enabled =false;
            cmdPartidas.DataSource = null;
            cmdHotel.DataSource = null;
            cmdActividades.DataSource = null;
            cmdActividades_2.DataSource = null;
            cmdActividades_3.DataSource = null;
            cmdHotel.Enabled = false;
            lblAlmuerzo.Text = "";
            cmdRegion.Text = "LIMA";
            cmdPartidas.Text = "(SELECCIONE)";
            lblIdNota.Text = "";
            lblidCliente.Text = "";

            dtimeFechaViaje.Text = DateTime.Now.ToString("dd/MM/yyyy");
            
            txtPrecio_2.Enabled = false;
            txtPrecio_3.Enabled = false;
            txtPrecio_4.Enabled = false;
            txtPrecio_5.Enabled = false;

            txtCan2.Enabled = false;
            txtCan3.Enabled = false;
            txtCan4.Enabled = false;
            txtCan5.Enabled = false;

            cmdServicios.Text = "(SELECCIONE)";
            cmdmoneda.Text ="SOLES";
            cmdAuxiliar.Text = "(SELECCIONE)";
            txttelefono.Text = "";
            txtregistro.Text = "";
            txtusuario.Text = "";
            txtusuario.Text = xUsuario;
            cmdCondicion.Text = "(SELECCIONE)";
            txtcliente.Text = "";
            txtDni.Text = "";
            txtcelular.Text = "";
            txtCantPasajeros.Text = "";
            txtHoraPar.Text = "";
            txtotroPuntoPartida.Text = "";
            txtVisitasExcursion.Text = "";
            cmdAlmuerzo.Text = "(SELECCIONE)";
            cmdActividades.Text = "-";
            cmdActividades_2.Text = "-";
            cmdActividades_3.Text = "-";
            cmdTraslados.Text = "-";
            txtEntradas.Text = "";
            txtPrecio_1.Text = "";
            txtCan1.Text = "";
            txtSubTotal_1.Text = "";
            txtEntradas.Text = "";
            txtPrecio_1.Text = "";
            txtCan1.Text = "";
            txtSubTotal_1.Text = "";
            txtPrecio_2.Text = "";
            txtCan2.Text = "";
            txtSubTotal_2.Text = "";
            txtPrecio_3.Text = "";
            txtCan3.Text = "";
            txtSubTotal_3.Text = "";
            txtPrecio_4.Text = "";
            txtCan4.Text = "";
            txtSubTotal_4.Text = "";
            txtPrecio_5.Text = "";
            txtCan5.Text = "";
            txtSubTotal_5.Text = "";
            txtPrecio_6.Text = "";
            txtCan6.Text = "";
            txtSubTotal_6.Text = "";
            cmdIgv.Text = "(SELECCIONE)";
            cmdCargos.Text = "(SELECCIONE)";
            txtIGV.Text = "";
            txtCargos.Text = "";
            txtTotalPagar.Text = "0.00";
            txtAcuenta.Text = "";
            txtSaldo.Text = "";
            txtExtraSol.Text = "";
            txtExtraDol.Text = "";
            dtimeFechaAdelanto.Text = DateTime.Now.ToString("dd/MM/yyyy");
            cmdMedioPago.Text = "(SELECCIONE)";
            cmdEntidad.Text = "(SELECCIONE)";
            cmdEntidad.Enabled = false;
            cmdDocumento.Text = "DOCUMENTO COBRANZA";
            txtNroOperacion.Text = "";
            txtAcuentaL.Text = "";
            txtNroOperacion.Enabled = false;
            txtSerie.Enabled = false;
            txtnroDoc.Enabled = false;

            txtSerie.Text = "";
            txtnroDoc.Text = "";
            ximagen.BackColor = Color.FromArgb(48, 84, 150);
            lblMensaje.BackColor = Color.FromArgb(48, 84, 150);
            lblMensaje.Text = "El Pasajero No \nTiene Deuda";
            txtObservaciones.Text = "";            
            txtAcuenta.Enabled = false;            
            dtimeFechaAdelanto.Enabled =true;
            txtdeposito.Enabled = false;
            txtefectivo.Enabled = false;

            txtruta.Text = "";
            txturl.Text = "";
            ximagen3.Image = null;
            imagecaptura.Image = null;
            ximgenpro.Image = null;
            imagecaptura.Visible = false;
            ximgenpro.Visible = false;
            txtdeposito.Text = "0.00";
            txtefectivo.Text = "0.00";

            gvliquidacion.Rows.Clear();
            gvliquidacion.Refresh();

            activarCajas();
            //txtotroPuntoPartida.Enabled =false;
            cmdTraslados.Enabled =false;
            cmdmoneda.Enabled = true;
            cmdMedioPago.Enabled =false;
            btnguardar.Enabled = true;
            btneditar.Enabled = false;
            btnactivar.Enabled = false;
            btneliminar.Enabled = false;
            btnpdf.Enabled = false;
            btnPDF2.Enabled = false;
            this.tabControl1.SelectedIndex = 0;
            this.tabControl3.SelectedIndex = 0;

            this.tabPage6.Parent = null;

            listarPanelPrin();
            this._PanelPrincipal.Visible = true;
            dtimeProgramacion.Focus();
        }
        public void activarCajas()
        {
            btnCanalVenta.Enabled =true;
            cmdRegion.Enabled = true;
            cmdServicios.Enabled = true;
            dtimeFechaViaje.Enabled = true;
            cmdAuxiliar.Enabled = true;
            txttelefono.Enabled = true;
            cmdCondicion.Enabled = true;
            txtcliente.Enabled = true;
            txtDni.Enabled = true;
            txtcelular.Enabled = true;
            txtCantPasajeros.Enabled = true;
            cmdPartidas.Enabled = true;
            txtHoraPar.Enabled = true;
            txtotroPuntoPartida.Enabled = true;
            cmdAlmuerzo.Enabled = true;
            cmdActividades.Enabled = true;
            cmdActividades_2.Enabled = true;
            cmdActividades_3.Enabled = true;
            //cmdTraslados.Enabled =true;
            txtPrecio_1.Enabled = true;

            if (txtCan2.Text.Length > 0) txtCan2.Enabled = true;
            if (txtSubTotal_2.Text.Length > 0) txtPrecio_2.Enabled = true;

            if (txtCan4.Text.Length > 0) txtCan4.Enabled = true;
            if (txtSubTotal_4.Text.Length > 0) txtPrecio_4.Enabled = true;

            if (txtCan3.Text.Length > 0) txtCan3.Enabled = true;
            if (txtSubTotal_3.Text.Length > 0) txtPrecio_3.Enabled = true;
            if (txtCan5.Text.Length > 0)
            {
                txtPrecio_5.Enabled = true;
                txtCan5.Enabled = true;
            }
            cmdIgv.Enabled = true;
            cmdCargos.Enabled = true;
            if (cmdCondicion.Text == "ACUENTA")
            {
                txtAcuenta.Enabled = true;
                dtimeFechaAdelanto.Enabled = true;
            }
            cmdMedioPago.Enabled = true;
            cmdDocumento.Enabled = true;
            if (!cmdDocumento.Text.Contains("DOCUMENTO COBRANZA"))
            {
                txtSerie.Enabled = true;
                txtnroDoc.Enabled = true;
            }
            txtObservaciones.Enabled = true;
            if (txtNroOperacion.Text.Length > 0) txtNroOperacion.Enabled = true;
            btnlimpiarimg.Enabled = true;
            btncargar.Enabled = true;
            txtExtraSol.Enabled = true;
            txtExtraDol.Enabled = true;
        }
        public void desactivarCajas()
        {
            btnCanalVenta.Enabled = false;
            cmdRegion.Enabled = false;
            cmdHotel.Enabled = false;
            btnlimpiarimg.Enabled = false;
            btncargar.Enabled = false;
            cmdServicios.Enabled = false;
            cmdmoneda.Enabled = false;
            dtimeFechaViaje.Enabled = false;
            cmdAuxiliar.Enabled = false;
            txttelefono.Enabled = false;
            cmdCondicion.Enabled = false;
            txtcliente.Enabled = false;
            txtDni.Enabled = false;
            txtcelular.Enabled = false;
            txtCantPasajeros.Enabled = false;
            cmdPartidas.Enabled = false;
            txtHoraPar.Enabled = false;
            txtotroPuntoPartida.Enabled = false;
            cmdAlmuerzo.Enabled = false;
            cmdActividades.Enabled = false;
            cmdActividades_2.Enabled = false;
            cmdActividades_3.Enabled = false;
            cmdTraslados.Enabled = false;
            txtPrecio_1.Enabled = false;
            txtPrecio_2.Enabled = false;
            txtPrecio_3.Enabled = false;
            txtPrecio_4.Enabled = false;
            txtPrecio_5.Enabled = false;
            txtCan1.Enabled = false;
            txtCan2.Enabled = false;
            txtCan3.Enabled = false;
            txtCan4.Enabled = false;
            txtCan5.Enabled = false;
            cmdIgv.Enabled = false;
            cmdCargos.Enabled = false;
            txtExtraSol.Enabled = false;
            txtExtraDol.Enabled = false;
            txtAcuenta.Enabled = false;
            dtimeFechaAdelanto.Enabled = false;
            cmdMedioPago.Enabled = false;
            cmdDocumento.Enabled = false;
            txtSerie.Enabled = false;
            txtnroDoc.Enabled = false;
            txtObservaciones.Enabled = false;
            txtNroOperacion.Enabled = false;
            cmdEntidad.Enabled = false;
            txtdeposito.Enabled = false;
            txtefectivo.Enabled = false;
            cmdHotel.Enabled = false;
            txtAcuentaL.Enabled = false;
            gvliquidacion.ReadOnly = true;
        }
        public void listarPanelPrin()
        {
            gvProgramacion.Rows.Clear();
            gvProgramacion.Refresh();
            string xvalue = string.Empty;
            xvalue = dtimeProgramacion.Value.ToString("MM/dd/yyyy") + "|" + dtimeProgramacion.Value.ToString("MM/dd/yyyy") + "|" + xIdCompania;
            AccesoDatos daSQL = new AccesoDatos("con");
            String rpt = daSQL.ejecutarComando("uspPanelFullDay", "@Valores", xvalue);
            if (rpt != "")
            {
                Cadena.llenaTabla8(gvProgramacion, rpt);
                contarFilasProgra();
                pintarCeldasBlo();
                if (xArea.Equals("OPERACIONES")||xArea.Equals("GERENCIA Y ADMINISTRACION"))
                {
                    gvProgramacion.ReadOnly = false;
                    btnGuardarMAX.Visible = true;
                    //btnExcel.Visible = true;
                }
                else
                {
                    gvProgramacion.ReadOnly = true;
                    btnGuardarMAX.Visible = false;
                    //btnExcel.Visible =false;
                }
            }
        }
        public void listarFecha()
        {
            gvpanel.DataSource = null;
            string xvalue = string.Empty;
            xvalue = dtimeinicio.Value.ToString("MM/dd/yyyy") + "|" +
                dtimefin.Value.ToString("MM/dd/yyyy") + "|" + xAreaId+"|"+xIdUsuario;
            AccesoDatos daSQL = new AccesoDatos("con");
            String rpt = daSQL.ejecutarComando("listaPedidosFecha", "@Valores", xvalue);
            if (rpt != "")
            {
                Tabla = Cadena.CrearTabla(rpt);
                vista = Tabla.DefaultView;
                bs = new BindingSource();
                bs.DataSource = Tabla;
                gvpanel.DataSource = bs;
                ocultarColumnas();
                totalista();
            }
        }
        public void listar()
        {
            gvpanel.DataSource = null;
            string xvalue = string.Empty;
            xvalue = xAreaId + "|" + xIdUsuario;
            AccesoDatos daSQL = new AccesoDatos("con");
            String rpt = daSQL.ejecutarComando("listarPedidos", "@Data", xvalue);
            if (rpt != "")
            {
                Tabla = Cadena.CrearTabla(rpt);
                vista = Tabla.DefaultView;
                bs = new BindingSource();
                bs.DataSource = Tabla;
                gvpanel.DataSource = bs;
                ocultarColumnas();
                totalista();
            }
        }

        public void listar_F(bool ztexto)
        {
            gvpanel.DataSource = null;
            string xvalue = string.Empty;
            if (ztexto == true) xvalue = cmdfiltrar.Text + "|" + txtbuscar.Text;
            else xvalue = "Numero|0";
            AccesoDatos daSQL = new AccesoDatos("con");
            String rpt = daSQL.ejecutarComando("listaPedidosFecha_C", "@Valores", xvalue);
            if (rpt != "")
            {
                Tabla = Cadena.CrearTabla(rpt);
                vista = Tabla.DefaultView;
                bs = new BindingSource();
                bs.DataSource = Tabla;
                gvpanel.DataSource = bs;
                ocultarColumnas();
                totalista();
            }
        }

        public void ocultarColumnas()
        {
            //gvpanel.Columns[2].Visible = false;
            gvpanel.Columns[3].Visible = false;
            gvpanel.Columns[7].Visible = false;
            gvpanel.Columns[15].Visible = false;
            gvpanel.Columns[24].Visible = false;
            gvpanel.Columns[25].Visible = false;
            gvpanel.Columns[26].Visible = false;
            gvpanel.Columns[27].Visible = false;
            gvpanel.Columns[31].Visible = false;
            gvpanel.Columns[32].Visible = false;
            gvpanel.Columns[33].Visible = false;
            gvpanel.Columns[34].Visible = false;
            gvpanel.Columns[35].Visible = false;
            gvpanel.Columns[36].Visible = false;
            gvpanel.Columns[37].Visible = false;
            gvpanel.Columns[38].Visible = false;
            gvpanel.Columns[39].Visible = false;
            gvpanel.Columns[40].Visible = false;
            gvpanel.Columns[41].Visible = false;
            gvpanel.Columns[42].Visible = false;
            gvpanel.Columns[43].Visible = false;
            gvpanel.Columns[44].Visible = false;
            gvpanel.Columns[46].Visible = false;
            gvpanel.Columns[47].Visible = false;
            gvpanel.Columns[49].Visible = false;
            gvpanel.Columns[1].Width = 80;
            gvpanel.Columns[2].Width =120;
            gvpanel.Columns[4].Width = 250;
            gvpanel.Columns[6].Width = 140;
            gvpanel.Columns[9].Width = 200;
            gvpanel.Columns[10].Width = 150;
            gvpanel.Columns[11].Width = 150;
            gvpanel.Columns[12].Width = 80;
            gvpanel.Columns[13].Width = 80;
            gvpanel.Columns[14].Width = 80;
            gvpanel.Columns[16].Width = 300;
            gvpanel.Columns[17].Width = 110;
            gvpanel.Columns[18].Width = 150;

            gvpanel.Columns[19].Width = 115;
            gvpanel.Columns[20].Width = 115;
            gvpanel.Columns[21].Width = 115;
            gvpanel.Columns[22].Width = 150;
            gvpanel.Columns[23].Width = 250;
            gvpanel.Columns[28].Width = 110;
            gvpanel.Columns[29].Width = 150;
            gvpanel.Columns[30].Width = 150;

            gvpanel.Columns[1].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
            gvpanel.Columns[2].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            gvpanel.Columns[8].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            gvpanel.Columns[12].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            gvpanel.Columns[13].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            gvpanel.Columns[14].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;

            gvpanel.Columns[19].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
            gvpanel.Columns[20].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
            gvpanel.Columns[21].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
        }
        public void cargarRegion()
        {
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("uspListarRegion");
            if (rpt != "")
            {
                listaRegiones= Cadena.AlistaCampoSelect(rpt);
                cmdRegion.DataSource =listaRegiones;
                cmdRegion.DisplayMember = "Nombre";
                cmdRegion.ValueMember = "Codigo";
            }
        }
        public void cargarLoad()
        {
            men.alternarcolor(gvliquidacion);
            this.txtusuario.Text = xUsuario;
            lblAlmuerzo.Text = "";
            cmdPartidas.Text = "(SELECCIONE)";
            cmdCondicion.Text = "(SELECCIONE)";
            cmdAlmuerzo.Text = "(SELECCIONE)";           
            cmdIgv.Text = "(SELECCIONE)";
            cmdCargos.Text = "(SELECCIONE)";
            cmdMedioPago.Text = "(SELECCIONE)";
            cmdEntidad.Text = "(SELECCIONE)";
            cmdDocumento.Text = "DOCUMENTO COBRANZA";
            lblMensaje.Text = "El Pasajero No \nTiene Deuda";
            cmdfiltrar.Text = "Auxiliar";
            cmdmoneda.Text = "SOLES";
            lblIdNota.Text = "";
            //cargarRegion();
            traerServicios();
            cmdTraslados.Text = "-";
            listarPanelPrin();
            //txtcliente.AutoCompleteCustomSource = AutoCompleClass.Autocomplete();
            cmdRegion.Text = "LIMA";
            this.tabPage6.Parent = null;
            listar();
        }
        private void NuevoViaje_Load(object sender, EventArgs e)
        {
            cargarLoad();
        }
        private void cmdServicios_SelectionChangeCommitted(object sender, EventArgs e)
        {
            traerVisitas(xlistas[1]);
        }
        private void txttelefono_TextChanged(object sender, EventArgs e)
        {
            txttelefono.CharacterCasing = CharacterCasing.Upper;
        }
        private void cmdAuxiliar_SelectionChangeCommitted(object sender, EventArgs e)
        {
            traerTelefono(xlistas[5]);
        }
        private void txtCantPasajeros_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)32)
            {
                e.Handled = true;
            }
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                cmdPartidas.Focus();
            }
            Validar.SoloNumeros(e);
        }
        private void txttelefono_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtcliente.SelectionStart = txtcliente.Text.Length;
                txtcliente.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        public void traerDatos()
        {
            lblidCliente.Text = "";
            if (txtcliente.Text.Length == 0)
            {
                men.datosVacios();
                txtcliente.Focus();
            }
            else
            {
                DataTable datos = objcliente.traerCliente(this.txtcliente.Text, xIdCompania.ToString());
                if (datos.Rows.Count == 0)
                {
                    //
                    txtDni.Text = "";
                    txtcelular.Text = "";
                }
                else
                {
                    lblidCliente.Text = datos.Rows[0][0].ToString();
                    txtDni.Text = datos.Rows[0][3].ToString();
                    txtcelular.Text = datos.Rows[0][6].ToString();
                }
                txtDni.SelectionStart = txtDni.Text.Length;
                txtDni.Focus();
            }
        }
        private void txtcliente_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyValue == 13) traerDatos();
        }
        private void dtimeFechaViaje_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                cmdAuxiliar.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        private void cmdPartidas_SelectionChangeCommitted(object sender, EventArgs e)
        {
            traerHora(xlistas[7]);
        }       
        private void txtotroPuntoPartida_TextChanged(object sender, EventArgs e)
        {
            txtotroPuntoPartida.CharacterCasing = CharacterCasing.Upper;
        }
        private void txtotroPuntoPartida_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtHoraPar.SelectionStart = txtHoraPar.Text.Length;
                txtHoraPar.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        private void txtCantAdicional_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.ShiftKey) cmdActividades.Focus();
        }
        private void txtCantPasajeros_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.ShiftKey) txtcelular.Focus();
        }
        private void txtVisitasExcursion_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.ShiftKey) txtotroPuntoPartida.Focus();
        }
        private void cmdCondicion_SelectionChangeCommitted(object sender, EventArgs e)
        {
            if (cmdCondicion.Text.Equals("(SELECCIONE)"))
            {
                txtdeposito.Text = "0.00";
                txtefectivo.Text = "0.00";
                txtNroOperacion.Text = "";
                cmdMedioPago.Enabled = false;
                cmdEntidad.Enabled = false;
                txtNroOperacion.Enabled = false;
                txtAcuenta.Enabled = false;
                dtimeFechaAdelanto.Enabled =false;
                cmdMedioPago.Text = "(SELECCIONE)";
                cmdEntidad.Text = "(SELECCIONE)";
                total();
                men.SeleccioneUnDato();
            }
            else
            {
                txtdeposito.Text = "0.00";
                txtefectivo.Text = "0.00";
                txtNroOperacion.Text = "";
                cmdMedioPago.Enabled = false;
                cmdEntidad.Enabled = false;          
                txtNroOperacion.Enabled = false;
                txtdeposito.Enabled = false;
                txtefectivo.Enabled = false;
                if (cmdCondicion.Text == "CREDITO")
                {
                    txtAcuenta.Enabled = false;
                    dtimeFechaAdelanto.Enabled = false;
                    cmdMedioPago.Text = "-";
                    cmdEntidad.Text = "-";
                    //txtdeposito.Enabled = false;
                    //txtefectivo.Enabled = false;
                    txtAcuenta.Text = "0.00";
                    txtcliente.SelectionStart = txtcliente.Text.Length;
                    txtcliente.Focus();
                }
                else if (cmdCondicion.Text == "ACUENTA")
                {
                    txtAcuenta.Enabled = true;
                    dtimeFechaAdelanto.Enabled = true;
                    cmdMedioPago.Text = "(SELECCIONE)";
                    cmdEntidad.Text = "(SELECCIONE)";
                    if (btnactivar.Enabled == false) cmdMedioPago.Enabled = true;
                    txtAcuenta.Text = "";
                    txtAcuenta.Focus();
                }
                else
                {
                    txtAcuenta.Enabled = false;
                    dtimeFechaAdelanto.Enabled = true;
                    cmdMedioPago.Text = "(SELECCIONE)";
                    cmdEntidad.Text = "(SELECCIONE)";
                    if (btnactivar.Enabled == false) cmdMedioPago.Enabled = true;
                    txtcliente.SelectionStart = txtcliente.Text.Length;
                    txtcliente.Focus();
                }
                total();
            }
        }
        private void txtVisitasExcursion_KeyPress(object sender, KeyPressEventArgs e)
        {
            cmdAlmuerzo.Focus();
        }
        public void calcularTours()
        {
            decimal xprecio = 0;
            decimal xcant = 0;
            decimal ximporte = 0;
            xprecio = (txtPrecio_1.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_1.Text);
            xcant = (txtCan1.Text.Length == 0) ? 0 : decimal.Parse(txtCan1.Text);
            ximporte = xprecio * xcant;
            txtSubTotal_1.Text = ximporte.ToString("N2");
        }
        public void calcularEntradaGen()
        {
            decimal xprecio = 0;
            decimal xcant = 0;
            decimal ximporte = 0;

            decimal xprecioB = 0;
            decimal xcantB = 0;
            decimal ximporteB = 0;

            if ((cmdActividades.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") || 
                cmdActividades_2.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") || 
                cmdActividades_3.Text.Equals("EXCURSIÓN ISLAS BALLESTAS")) && 
                txtPrecio_6.Text.Length > 0)
            {
                xprecio = (txtPrecio_6.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_6.Text);
                xcant = (txtCan6.Text.Length == 0) ? 0 : decimal.Parse(txtCan6.Text);
                ximporte = xprecio * xcant;
                txtSubTotal_6.Text = ximporte.ToString("N2");
            }
            else
            {
                xprecio = (txtPrecio_2.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_2.Text);
                xcant = (txtCan2.Text.Length == 0) ? 0 : decimal.Parse(txtCan2.Text);
                ximporte = xprecio * xcant;
                txtSubTotal_2.Text = ximporte.ToString("N2");

                xprecioB = (txtPrecio_3.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_3.Text);
                xcantB = (txtCan3.Text.Length == 0) ? 0 : decimal.Parse(txtCan3.Text);
                ximporteB = xprecioB * xcantB;
                txtSubTotal_3.Text = ximporteB.ToString("N2");

            }
        }
        public void calcularEntrada()
        {
            if (xflac == 1)
            {
                //
            }
            else
            {
                decimal xprecio = 0;
                decimal xcant = 0;
                decimal ximporte = 0;
                if ((cmdActividades.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") || 
                    cmdActividades_2.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") || 
                    cmdActividades_3.Text.Equals("EXCURSIÓN ISLAS BALLESTAS"))&&
                    (txtPrecio_2.Enabled == false || txtPrecio_3.Enabled == false||txtPrecio_4.Enabled == false))
                {
                    txtSubTotal_2.Text = "";
                    txtCan6.Text = txtCan2.Text;
                    xprecio = (txtPrecio_6.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_6.Text);
                    xcant = (txtCan6.Text.Length == 0) ? 0 : decimal.Parse(txtCan6.Text);
                    ximporte = xprecio * xcant;
                    txtSubTotal_6.Text = ximporte.ToString("N2");
                }
                else
                {
                    //txtSubTotal_2.Text = "";
                    //txtSubTotal_3.Text = "";

                    txtPrecio_6.Text = "";
                    txtCan6.Text = "";
                    txtEntradas.Text = "N/A";
                    txtSubTotal_6.Text = "";
                }

                xprecio = (txtPrecio_2.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_2.Text);
                xcant = (txtCan2.Text.Length == 0) ? 0 : decimal.Parse(txtCan2.Text);
                ximporte = xprecio * xcant;
                txtSubTotal_2.Text = ximporte.ToString("N2");
            }
            total();
        }
        public void calcularEntradaB()
        {
            if (xflac == 1)
            {
                //
            }
            else
            {
                decimal xprecio = 0;
                decimal xcant = 0;
                decimal ximporte = 0;
                if ((cmdActividades.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") || 
                    cmdActividades_2.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") || 
                    cmdActividades_3.Text.Equals("EXCURSIÓN ISLAS BALLESTAS")) && 
                    (txtPrecio_2.Enabled == false || txtPrecio_3.Enabled == false || txtPrecio_4.Enabled == false))
                {
                    txtSubTotal_3.Text = "";
                    txtCan6.Text = txtCan3.Text;
                    xprecio = (txtPrecio_6.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_6.Text);
                    xcant = (txtCan6.Text.Length == 0) ? 0 : decimal.Parse(txtCan6.Text);
                    ximporte = xprecio * xcant;
                    txtSubTotal_6.Text = ximporte.ToString("N2");
                }
                else
                {
                    //txtSubTotal_2.Text = "";
                    //txtSubTotal_3.Text = "";
                    txtPrecio_6.Text = "";
                    txtCan6.Text = "";
                    txtEntradas.Text = "N/A";
                    txtSubTotal_6.Text = "";
                }
                xprecio = (txtPrecio_3.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_3.Text);
                xcant = (txtCan3.Text.Length == 0) ? 0 : decimal.Parse(txtCan3.Text);
                ximporte = xprecio * xcant;
                txtSubTotal_3.Text = ximporte.ToString("N2");
            }
            total();
        }
        //


        public void calcularEntradaC()
        {
            if (xflac == 1)
            {
                //
            }
            else
            {

                decimal xprecio = 0;
                decimal xcant = 0;
                decimal ximporte = 0;
                if ((cmdActividades.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") ||
                    cmdActividades_2.Text.Equals("EXCURSIÓN ISLAS BALLESTAS") ||
                    cmdActividades_3.Text.Equals("EXCURSIÓN ISLAS BALLESTAS")) &&
                    (txtPrecio_6.Text.Length > 0 && (txtPrecio_2.Enabled == false ||
                    txtPrecio_3.Enabled == false|| txtPrecio_4.Enabled == false)))
                {
                    txtSubTotal_4.Text = "";
                    txtCan6.Text = txtCan3.Text;
                    xprecio = (txtPrecio_6.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_6.Text);
                    xcant = (txtCan6.Text.Length == 0) ? 0 : decimal.Parse(txtCan6.Text);
                    ximporte = xprecio * xcant;
                    txtSubTotal_6.Text = ximporte.ToString("N2");
                }
                else
                {
                    //txtSubTotal_2.Text = "";
                    //txtSubTotal_3.Text = "";
                    txtPrecio_6.Text = "";
                    txtCan6.Text = "";
                    txtEntradas.Text = "N/A";
                    txtSubTotal_6.Text = "";
                }
                xprecio = (txtPrecio_4.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_4.Text);
                xcant = (txtCan4.Text.Length == 0) ? 0 : decimal.Parse(txtCan4.Text);
                ximporte = xprecio * xcant;
                txtSubTotal_4.Text = ximporte.ToString("N2");
            }
            total();
        }

        private void txtCantPasajeros_TextChanged(object sender, EventArgs e)
        {
            if (xSoli == 0)
            {
                int xcanpri = 0;
                xcanpri = (txtCantPasajeros.Text.Length == 0) ? 0 : int.Parse(txtCantPasajeros.Text);
                if (this.lblDisponible.Visible==true && (xcanpri > int.Parse(lblDisponible.Text)))
                {
                    MessageBox.Show("LA CANTIDAD QUE INGRESO ES MAYOR ALA CANTIDAD DISPONIBLE...", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtCantPasajeros.Text = "";
                }
                else
                {
                    txtSubTotal_1.Text = "";
                    txtSubTotal_2.Text = "";
                    txtSubTotal_3.Text = "";
                    txtCan1.Text = txtCantPasajeros.Text;
                    if (cmdActividades.Items.Count > 0 && (cmdActividades.DataSource != null || cmdActividades.SelectedValue.ToString() != "0")) txtCan2.Text = txtCantPasajeros.Text;
                    if (cmdActividades_2.Items.Count > 0 && (cmdActividades_2.DataSource != null || cmdActividades_2.SelectedValue.ToString() != "0")) txtCan3.Text = txtCantPasajeros.Text;
                    if (cmdTraslados.Items.Count > 0 && (cmdTraslados.DataSource != null || cmdTraslados.SelectedValue.ToString() != "0")) txtCan5.Text = txtCantPasajeros.Text;
                    if (txtPrecio_6.Text.Length > 0) txtCan6.Text = txtCantPasajeros.Text;
                    if (lblAlmuerzo.Text.Length > 0)
                    {
                        decimal xPrecioFinal = 0;
                        decimal xsub_1 = 0;
                        decimal xCantidadPX = 0;
                        xCantidadPX = (txtCan1.Text.Length > 0) ? decimal.Parse(txtCan1.Text) : 0;
                        xtotalEnAl = decimal.Parse(lblAlmuerzo.Text) * xCantidadPX;
                        xPrecioFinal = xPrecioTours + xtotalEnAl;
                        txtPrecio_1.Text = xPrecioFinal.ToString("N2");
                        xsub_1 = xPrecioFinal * xCantidadPX;
                        txtSubTotal_1.Text = xsub_1.ToString("N2");
                    }
                    calcularTours();
                    calcularEntradaGen();
                    total();
                }
            }
        }
        private void txtCan3_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)32)
            {
                e.Handled = true;
            }
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtPrecio_4.Focus();
            }
            Validar.SoloNumeros(e);
        }
        private void txtCan4_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)32)
            {
                e.Handled = true;
            }
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtPrecio_5.Focus();
            }
            Validar.SoloNumeros(e);
        }
        private void txtCan5_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)32)
            {
                e.Handled = true;
            }
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtPrecio_6.Focus();
            }
            Validar.SoloNumeros(e);
        }
        private void txtCan6_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)32)
            {
                e.Handled = true;
            }
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
            }
            Validar.SoloNumeros(e);
        }
        private void txtCan2_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)32)
            {
                e.Handled = true;
            }
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtPrecio_3.Focus();
            }
            Validar.SoloNumeros(e);
        }
        private void txtPrecio_1_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtPrecio_2.SelectionStart = txtPrecio_2.Text.Length;
                txtPrecio_2.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtPrecio_1.Text.Length; i++)
            {
                if (txtPrecio_1.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void txtPrecio_2_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtCan2.SelectionStart = txtCan2.Text.Length;
                txtCan2.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtPrecio_2.Text.Length; i++)
            {
                if (txtPrecio_2.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }

        private void txtPrecio_3_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtCan3.SelectionStart = txtCan3.Text.Length;
                txtCan3.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtPrecio_3.Text.Length; i++)
            {
                if (txtPrecio_3.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void txtPrecio_4_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtCan4.SelectionStart = txtCan4.Text.Length;
                txtCan4.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtPrecio_4.Text.Length; i++)
            {
                if (txtPrecio_4.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void txtPrecio_5_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtCan5.SelectionStart = txtCan5.Text.Length;
                txtCan5.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtPrecio_5.Text.Length; i++)
            {
                if (txtPrecio_5.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void txtPrecio_6_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtCan6.SelectionStart = txtCan6.Text.Length;
                txtCan6.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtPrecio_6.Text.Length; i++)
            {
                if (txtPrecio_6.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void txtCan6_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up) txtCan5.Focus();
            else if (e.KeyCode == Keys.ShiftKey) txtPrecio_6.Focus();
        }
        private void txtCan5_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up) txtCan4.Focus();
            else if (e.KeyCode == Keys.Down) txtCan5.Focus();
            else if (e.KeyCode == Keys.ShiftKey) txtPrecio_5.Focus();
        }
        private void txtCan4_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up) txtCan3.Focus();
            else if (e.KeyCode == Keys.Down) txtCan5.Focus();
            else if (e.KeyCode == Keys.ShiftKey) txtPrecio_4.Focus();
        }
        private void txtCan3_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up) txtCan2.Focus();
            else if (e.KeyCode == Keys.Down) txtCan4.Focus();
            else if (e.KeyCode == Keys.ShiftKey) txtPrecio_3.Focus();
        }
        private void txtPrecio_6_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up) txtPrecio_5.Focus();
        }
        private void txtPrecio_5_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up)
            {
                txtPrecio_4.SelectionStart = txtPrecio_4.Text.Length;
                txtPrecio_4.Focus();
            }
            else if (e.KeyCode == Keys.Down)
            {
                txtPrecio_6.SelectionStart = txtPrecio_6.Text.Length;
                txtPrecio_6.Focus();
            }
        }
        private void txtPrecio_4_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up)
            {
                txtPrecio_3.SelectionStart = txtPrecio_3.Text.Length;
                txtPrecio_3.Focus();
            }
            else if (e.KeyCode == Keys.Down)
            {
                txtPrecio_5.SelectionStart = txtPrecio_5.Text.Length;
                txtPrecio_5.Focus();
            }
        }
        private void txtPrecio_3_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up)
            {
                txtPrecio_2.SelectionStart = txtPrecio_2.Text.Length;
                txtPrecio_2.Focus();
            }
            else if (e.KeyCode == Keys.Down)
            {
                txtPrecio_4.SelectionStart = txtPrecio_4.Text.Length;
                txtPrecio_4.Focus();
            }
        }
        private void txtPrecio_2_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up)
            {
                txtPrecio_1.SelectionStart = txtPrecio_1.Text.Length;
                txtPrecio_1.Focus();
            }
            else if (e.KeyCode == Keys.Down)
            {
                txtPrecio_3.SelectionStart = txtPrecio_3.Text.Length;
                txtPrecio_3.Focus();
            }
        }
        private void txtCan2_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up) txtPrecio_2.Focus();
            else if (e.KeyCode == Keys.Down) txtCan3.Focus();
            else if (e.KeyCode == Keys.ShiftKey) txtPrecio_2.Focus();
        }
        private void txtPrecio_1_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Down)
            {
                txtPrecio_2.SelectionStart = txtPrecio_2.Text.Length;
                txtPrecio_2.Focus();
            }
        }
        private void cmdActividades_SelectionChangeCommitted(object sender, EventArgs e)
        {
            xflac = 0;
            if (cmdActividades.SelectedValue.ToString() != "0")
            {
                if (cmdActividades.SelectedValue.ToString() == cmdActividades_2.SelectedValue.ToString())
                {
                    limpiaFila2();
                    MessageBox.Show("LA ACTIVIDAD NO PUEDE SER IGUAL A LA ACTIVIDAD 2...SELECCIONE OTRA ACTIVIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    cmdActividades.Text = "-";
                }
                else if (cmdActividades.SelectedValue.ToString() == cmdActividades_3.SelectedValue.ToString())
                {
                    limpiaFila2();
                    MessageBox.Show("LA ACTIVIDAD NO PUEDE SER IGUAL A LA ACTIVIDAD 3...SELECCIONE OTRA ACTIVIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    cmdActividades.Text = "-";
                }
                else
                {
                    traerPrecio(xlistas[6]);
                }
            }
            else
            {
                limpiaFila2();
            }
            xflac = 0;
        }
        private void txtPrecio_1_TextChanged(object sender, EventArgs e)
        {
            if (xSoli == 0)
            {
                calcularTours();
                total();
            }
        }
        private void txtEntradas_TextChanged(object sender, EventArgs e)
        {
            txtEntradas.CharacterCasing = CharacterCasing.Upper;
        }
        private void txtCan2_TextChanged(object sender, EventArgs e)
        {
            if (btnactivar.Enabled == false)
            {
                if (txtCantPasajeros.Text.Length > 0)
                {
                    if (txtCan2.Text.Length == 0)
                    {
                        calcularEntrada();
                    }
                    else
                    {
                        if (int.Parse(txtCan2.Text) > int.Parse(txtCantPasajeros.Text))
                        {
                            MessageBox.Show("LA CANTIDAD DE ACTIVIDADES ADICIONALES NO PUEDE SER MAYOR A LA CANTIDAD DE PASAJEROS...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                            txtCan2.Text = "";
                            txtCan2.Focus();
                        }
                        else
                        {
                            calcularEntrada();
                        }
                    }
                }
            }
        }
        private void txtPrecio_2_TextChanged(object sender, EventArgs e)
        {
            if (btnactivar.Enabled == false)
            {
                if (txtCantPasajeros.Text.Length > 0)
                {
                    calcularEntrada();
                }
            }
        }
        private void cmdActividades_2_SelectionChangeCommitted(object sender, EventArgs e)
        {
            xflac = 0;
            if (cmdActividades_2.SelectedValue.ToString() != "0")
            {
                if (cmdActividades_2.SelectedValue.ToString() == cmdActividades.SelectedValue.ToString())
                {
                    limpiaFila3();
                    MessageBox.Show("LA ACTIVIDAD 2 NO PUEDE SER IGUAL A LA ACTIVIDAD 1...SELECCIONE OTRA ACTIVIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    cmdActividades_2.Text = "-";
                }
                else if (cmdActividades_2.SelectedValue.ToString() == cmdActividades_3.SelectedValue.ToString())
                {
                    limpiaFila3();
                    MessageBox.Show("LA ACTIVIDAD 2 NO PUEDE SER IGUAL A LA ACTIVIDAD 3...SELECCIONE OTRA ACTIVIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    cmdActividades_2.Text = "-";

                }
                else
                {
                    traerPrecio2(xlistas[6]);
                }
            }
            else
            {
                limpiaFila3();
            }
            xflac = 0;
        }
        private void cmdActividades_3_SelectionChangeCommitted(object sender, EventArgs e)
        {
            xflac = 0;
            if (cmdActividades_3.SelectedValue.ToString() != "0")
            {
                if (cmdActividades_3.SelectedValue.ToString() == cmdActividades.SelectedValue.ToString())
                {
                    limpiaFila4();
                    MessageBox.Show("LA ACTIVIDAD 2 NO PUEDE SER IGUAL A LA ACTIVIDAD 1...SELECCIONE OTRA ACTIVIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    cmdActividades_3.Text = "-";
                }
                else if (cmdActividades_3.SelectedValue.ToString() == cmdActividades_2.SelectedValue.ToString())
                {
                    limpiaFila4();
                    MessageBox.Show("LA ACTIVIDAD 3 NO PUEDE SER IGUAL A LA ACTIVIDAD 2...SELECCIONE OTRA ACTIVIDAD", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    cmdActividades_3.Text = "-";

                }
                else
                {
                    traerPrecio3(xlistas[6]);
                }
            }
            else
            {
                limpiaFila4();
            }
            xflac = 0;
        }
        private void txtPrecio_3_TextChanged(object sender, EventArgs e)
        {
            if (btnactivar.Enabled == false)
            {
                if (txtCantPasajeros.Text.Length > 0)
                {
                    calcularEntradaB();
                }
            }
        }
        private void txtCan3_TextChanged(object sender, EventArgs e)
        {
            if (btnactivar.Enabled == false)
            {
                if (txtCantPasajeros.Text.Length > 0)
                {
                    if (txtCan3.Text.Length == 0)
                    {
                        calcularEntradaB();
                    }
                    else
                    {
                        if (int.Parse(txtCan3.Text) > int.Parse(txtCantPasajeros.Text))
                        {
                            MessageBox.Show("LA CANTIDAD DE ACTIVIDADES ADICIONALES NO PUEDE SER MAYOR A LA CANTIDAD DE PASAJEROS...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                            txtCan3.Text = "";
                            txtCan3.Focus();
                        }
                        else
                        {
                            calcularEntradaB();
                        }
                    }
                }
            }
        }
        public void activarTraslados()
        {
            txtCan5.Enabled = true;
            txtPrecio_5.Enabled = true;
            txtPrecio_5.Focus();
        }
        public void desactivarTraslados()
        {
            txtCan5.Text = "";
            txtPrecio_5.Text = "";
            txtCan5.Enabled = false;
            txtPrecio_5.Enabled = false;
        }
        public void calcularTraslado()
        {
            decimal xprecio = 0;
            decimal xcant = 0;
            decimal ximporte = 0;

            xprecio = (txtPrecio_5.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_5.Text);
            xcant = (txtCan5.Text.Length == 0) ? 0 : decimal.Parse(txtCan5.Text);
            ximporte = xprecio * xcant;
            txtSubTotal_5.Text = ximporte.ToString("N2");
            total();
        }
        private void cmdTraslados_SelectionChangeCommitted(object sender, EventArgs e)
        {
            if (cmdTraslados.Text == "(SELECCIONE)" || cmdTraslados.Text == "-")
            {
                desactivarTraslados();
            }
            else
            {
                traerPrecioTras(xlistas[11]);
            }
        }
        private void txtPrecio_5_TextChanged(object sender, EventArgs e)
        {
            if (btnactivar.Enabled == false)calcularTraslado();
        }
        private void txtCan5_TextChanged(object sender, EventArgs e)
        {
            if (btnactivar.Enabled == false) calcularTraslado();
        }
        private void txtExtraSol_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtExtraDol.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtExtraSol.Text.Length; i++)
            {
                if (txtExtraSol.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void txtExtraDol_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                //txtPrecio_2.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtExtraDol.Text.Length; i++)
            {
                if (txtExtraDol.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void txtnroDoc_TextChanged(object sender, EventArgs e)
        {
            txtnroDoc.CharacterCasing = CharacterCasing.Upper;
        }
        private void txtObservaciones_TextChanged(object sender, EventArgs e)
        {
            txtObservaciones.CharacterCasing = CharacterCasing.Upper;
        }
        public double calcularIgv()
        {
            double xigv = 0;
            if (cmdIgv.Text.Equals("Incluye Impuestos"))
            {
                xigv = double.Parse(xTotalPri.ToString()) * 0.18;
                txtIGV.Text = xigv.ToString("N2");
            }
            else
            {
                txtIGV.Text = "";
            }
            return xigv;
        }
        public double calcularVisa()
        {
            double xvisa = 0;
            if (cmdCargos.Text.Equals("Pagos Visa MasterCard"))
            {
                xvisa= double.Parse(xTotalPri.ToString()) * 0.05;
                txtCargos.Text = xvisa.ToString("N2");
            }
            else
            {
                txtCargos.Text = "";
            }
            return xvisa;
        }
        private void cmdIgv_SelectionChangeCommitted(object sender, EventArgs e)
        {
            if (cmdIgv.Text.Equals("(SELECCIONE)")) men.SeleccioneUnDato();
            else total();
        }
        private void cmdCargos_SelectionChangeCommitted(object sender, EventArgs e)
        {
            if (cmdCargos.Text.Equals("(SELECCIONE)")) men.SeleccioneUnDato();
            else total();
        }
        private void txtExtraDol_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.ShiftKey)
            {
                txtExtraSol.SelectionStart = txtExtraSol.Text.Length;
                txtExtraSol.Focus();
            }
        }
        private void txtnroDoc_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)32)
            {
                e.Handled = true;
            }
        }
        private void txtnroDoc_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.ShiftKey)
            {
                txtSerie.SelectionStart = txtSerie.Text.Length;
                txtSerie.Focus();
            }
        }
        private void txtAcuenta_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtAcuenta.Text.Length; i++)
            {
                if (txtAcuenta.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        public void calcularSaldo()
        {
            double xsaldo = 0;
            double xacuenta = 0;
            double xPagar = 0;
            string xTextoMoneda = string.Empty;
            xPagar = (txtTotalPagar.Text.Length == 0) ? 0 : double.Parse(txtTotalPagar.Text);
            xacuenta = (txtAcuenta.Text.Length == 0) ? 0 : double.Parse(txtAcuenta.Text);

            double xExtraA = 0;
            double xOtraExtra = 0;
            string xMonExtra = string.Empty;

            if (cmdmoneda.Text == "SOLES")
            {
                xExtraA = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xTextoMoneda = "S/ ";
                xOtraExtra = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xMonExtra = "$ ";
            }
            else
            {
                xExtraA = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xTextoMoneda = "$ ";
                xOtraExtra = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xMonExtra = "S/ ";
            }

            xsaldo = xPagar - xacuenta;
            xsaldo = xsaldo + xExtraA;
            txtSaldo.Text = xsaldo.ToString("N2");

            if (cmdMedioPago.Text == "EFECTIVO" || cmdMedioPago.Text == "-" || cmdMedioPago.Text == "(SELECCIONE)")
            {
                txtefectivo.Text = txtAcuenta.Text;
                txtdeposito.Text = "0.00";
            }
            else
            {
                if (cmdMedioPago.Text == "DEPOSITO" || cmdMedioPago.Text == "YAPE" || cmdMedioPago.Text == "PLIN")
                {
                    txtdeposito.Text = txtAcuenta.Text;
                    txtefectivo.Text = "0.00";
                }
                else
                {

                }
            }
            if (xsaldo > 0)
            {
                ximagen.BackColor = Color.FromArgb(192, 0, 0);
                lblMensaje.BackColor = Color.FromArgb(192, 0, 0);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text;
                }
                else
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
            else
            {
                ximagen.BackColor = Color.FromArgb(48, 84, 150);
                lblMensaje.BackColor = Color.FromArgb(48, 84, 150);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda";
                }
                else
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda" + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
        }

        public void calcularSaldoB(double xEfec_P, double xDepo_P, double xImp_P)
        {
            double xsaldo = 0;
            double xacuenta = 0;
            double xPagar = 0;
            string xTextoMoneda = string.Empty;
            xPagar = (txtTotalPagar.Text.Length == 0) ? 0 : double.Parse(txtTotalPagar.Text);
            xacuenta = xAcuenta_Fijo;

            double xExtraA = 0;
            double xOtraExtra = 0;
            string xMonExtra = string.Empty;

            if (cmdmoneda.Text == "SOLES")
            {
                xExtraA = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xTextoMoneda = "S/ ";
                xOtraExtra = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xMonExtra = "$ ";
            }
            else
            {
                xExtraA = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xTextoMoneda = "$ ";
                xOtraExtra = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xMonExtra = "S/ ";
            }

            xacuenta = xacuenta + xImp_P;
            xsaldo = xPagar - xacuenta;
            xsaldo = xsaldo + xExtraA;
            txtSaldo.Text = xsaldo.ToString("N2");
            txtAcuenta.Text = xacuenta.ToString("N2");

            double xEfectivo = 0;
            double xDeposito = 0;

            xEfectivo =xEfec_Fijo+ xEfec_P;
            xDeposito =xDepo_Fijo+ xDepo_P;

            txtefectivo.Text = xEfectivo.ToString("N2");
            txtdeposito.Text = xDeposito.ToString("N2");

            if (xsaldo > 0)
            {
                ximagen.BackColor = Color.FromArgb(192, 0, 0);
                lblMensaje.BackColor = Color.FromArgb(192, 0, 0);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text;
                }
                else
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
            else
            {
                ximagen.BackColor = Color.FromArgb(48, 84, 150);
                lblMensaje.BackColor = Color.FromArgb(48, 84, 150);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda";
                }
                else
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda" + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
        }
        //
        public void calcularSaldoEli(double xEfecEli, double xDepoEli, double xImpEli)
        {
            double xsaldo = 0;
            double xacuenta = 0;
            double xPagar = 0;
            string xTextoMoneda = string.Empty;
            xPagar = (txtTotalPagar.Text.Length == 0) ? 0 : double.Parse(txtTotalPagar.Text);
            xacuenta = xAcuenta_Fijo;

            double xExtraA = 0;
            double xOtraExtra = 0;
            string xMonExtra = string.Empty;

            if (cmdmoneda.Text == "SOLES")
            {
                xExtraA = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xTextoMoneda = "S/ ";
                xOtraExtra = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xMonExtra = "$ ";
            }
            else
            {
                xExtraA = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xTextoMoneda = "$ ";
                xOtraExtra = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xMonExtra = "S/ ";
            }

            xacuenta = xacuenta - xImpEli;
            xsaldo = xPagar - xacuenta;
            xsaldo = xsaldo + xExtraA;
            txtSaldo.Text = xsaldo.ToString("N2");
            txtAcuenta.Text = xacuenta.ToString("N2");

            double xEfectivo = 0;
            double xDeposito = 0;

            xEfectivo = xEfec_Fijo - xEfecEli;
            xDeposito = xDepo_Fijo - xDepoEli;

            txtefectivo.Text = xEfectivo.ToString("N2");
            txtdeposito.Text = xDeposito.ToString("N2");

            if (xsaldo > 0)
            {
                ximagen.BackColor = Color.FromArgb(192, 0, 0);
                lblMensaje.BackColor = Color.FromArgb(192, 0, 0);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text;
                }
                else
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
            else
            {
                ximagen.BackColor = Color.FromArgb(48, 84, 150);
                lblMensaje.BackColor = Color.FromArgb(48, 84, 150);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda";
                }
                else
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda" + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
        }
        private void txtAcuenta_TextChanged(object sender, EventArgs e)
        {
            if (txtAcuenta.Enabled == true)
            {
                if (txtAcuenta.Text.Length == 0)
                {
                    calcularSaldo();
                }
                else
                {
                    if (decimal.Parse(txtAcuenta.Text) > decimal.Parse(txtTotalPagar.Text))
                    {
                        MessageBox.Show("EL ACUENTA EFECTIVO NO PUEDE SER MAYOR AL TOTAL A PAGAR...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                        txtAcuenta.Text = "";
                        txtAcuenta.Focus();
                    }
                    else
                    {
                        calcularSaldo();
                    }
                }
            }
        }
        private void txtSerie_TextChanged(object sender, EventArgs e)
        {
            txtSerie.CharacterCasing = CharacterCasing.Upper;
        }
        private void btnguardar_Click(object sender, EventArgs e)
        {
            validarGuardado();
        }
        private void btnlimpiar_Click(object sender, EventArgs e)
        {
            limpiar();
        }
        private void cmdDocumento_SelectionChangeCommitted(object sender, EventArgs e)
        {
            if (cmdDocumento.Text != "DOCUMENTO COBRANZA")
            {
                txtSerie.Text = "";
                txtnroDoc.Text = "";
                txtSerie.Enabled = true;
                txtnroDoc.Enabled = true;
                txtSerie.Focus();
            }
            else
            {
                txtSerie.Text = "";
                txtnroDoc.Text = "";
                txtSerie.Enabled = false;
                txtnroDoc.Enabled = false;
            }
        }
        private void txtSerie_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)32)
            {
                e.Handled = true;
            }
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtnroDoc.Focus();
            }
        }
        private void gvpanel_ColumnAdded(object sender, DataGridViewColumnEventArgs e)
        {
            gvpanel.Columns[e.Column.Index].SortMode = DataGridViewColumnSortMode.NotSortable;
        }
        private void NuevoViaje_KeyDown(object sender, KeyEventArgs e)
        {
            if (Convert.ToInt32(e.KeyData) == Convert.ToInt32(Keys.Control) + Convert.ToInt32(Keys.G))
            {
                if (btnguardar.Enabled == true)
                {
                    validarGuardado();
                }
                else
                {
                    if (btneditar.Enabled == false) men.activeCajas();
                    else validarEditar();
                }
            }
            else if (Convert.ToInt32(e.KeyData) == Convert.ToInt32(Keys.Control) + Convert.ToInt32(Keys.A))
            {
                botonActivar();
            }
            else if (Convert.ToInt32(e.KeyData) == Convert.ToInt32(Keys.Control) + Convert.ToInt32(Keys.N))
            {
                limpiar();
            }
            else if (Convert.ToInt32(e.KeyData) == Convert.ToInt32(Keys.Control) + Convert.ToInt32(Keys.L))
            {
                this.tabControl1.SelectedIndex = 1;
                txtbuscar.Text = "";
                txtbuscar.Focus();
            }
            else if (e.KeyCode == Keys.Escape)
            {

                if (btneditar.Enabled == false)
                {
                    this.tabControl1.SelectedIndex = 1;
                    gvpanel.Focus();
                }
            }
            else if (e.KeyCode == Keys.F5)
            {
                if (this.tabControl1.SelectedIndex == 1) listar();
                else
                {
                    if (_PanelPrincipal.Visible == true) listarPanelPrin();
                }
            }
        }
        private void cmdfiltrar_SelectionChangeCommitted(object sender, EventArgs e)
        {
            txtbuscar.Text = "";
            txtbuscar.Focus();
        }
        private void txtbuscar_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up) cmdfiltrar.Focus();
        }
        private void txtbuscar_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                gvpanel.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        private void gvpanel_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                if (gvpanel.Rows.Count > 0)
                {
                    if (gvpanel.CurrentCell.ColumnIndex == 0)
                    {
                        e.SuppressKeyPress = true;
                        solicitarDatos();
                    }
                    else if (gvpanel.CurrentCell.ColumnIndex == 21)
                    {
                        e.SuppressKeyPress = true;
                        if (Convert.ToString(gvpanel.CurrentRow.Cells[28].Value) == "ANULADO")
                        {
                            MessageBox.Show("LOS DOCUMENTOS ANULADOS NO TIENEN LIQUIDACION...", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        }
                        else
                        {
                            KardexVenta xkardex;
                            xkardex = new KardexVenta();
                            xkardex.xidnota = Convert.ToString(gvpanel.CurrentRow.Cells[1].Value);
                            xkardex.xDocumento = Convert.ToString(gvpanel.CurrentRow.Cells[2].Value);
                            xkardex.xcliente = Convert.ToString(gvpanel.CurrentRow.Cells[9].Value);
                            xkardex.xvendedor = Convert.ToString(gvpanel.CurrentRow.Cells[11].Value);
                            xkardex.xCondicion = Convert.ToString(gvpanel.CurrentRow.Cells[17].Value);
                            xkardex.xtotal = Convert.ToString(gvpanel.CurrentRow.Cells[19].Value);
                            xkardex.xNroDoocu = Convert.ToString(gvpanel.CurrentRow.Cells[31].Value) + "-" + Convert.ToString(gvpanel.CurrentRow.Cells[32].Value);
                            xkardex.ShowDialog();
                        }
                    }
                }
            }
            else if (e.KeyCode == Keys.ShiftKey)
            {
                txtbuscar.Focus();
            }
        }
        public void buscarTexto()
        {
            if (txtbuscar.Text != "" && cmdfiltrar.SelectedItem != null)
            {
                string campo = cmdfiltrar.Text;
                string tipo = Tabla.Columns[campo].DataType.ToString();
                if (tipo.Contains("String")) vista.RowFilter = "[" + campo + "] Like '%" + txtbuscar.Text + "%'";
                else vista.RowFilter = "[" + campo + "] Like '%" + txtbuscar.Text + "%'";
                totalista();
            }
            else
            {
                vista.RowFilter = "";
                totalista();
            }
        }
        public void buscarTexto_F()
        {
            if (txtbuscar.Text != "" && cmdfiltrar.SelectedItem != null)
            {
                listar_F(true);
            }
            else
            {
                listar_F(false);
            }
        }
        private void txtbuscar_TextChanged(object sender, EventArgs e)
        {
            if (cmdfiltrar.Enabled==false) buscarTexto_F();
            else buscarTexto();
        }
        private void dtimeinicio_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                dtimefin.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        private void dtimeinicio_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.ShiftKey) txtbuscar.Focus();
        }
        private void dtimefin_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                listarFecha();
            }
            else
            {
                e.Handled = false;
            }
        }
        private void dtimefin_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.ShiftKey)dtimeinicio.Focus();
        }
        private void linklistar_Click(object sender, EventArgs e)
        {
            listar();
        }
        private void linkbuscar_Click(object sender, EventArgs e)
        {
            listarFecha();
            gvpanel.Focus();
        }
        public bool validaIP()
        {
            xIpValida = false;

            Ping Pings = new Ping();
            int timeout = 10;

            if (Pings.Send(xconexion.xIPServidor, timeout).Status == IPStatus.Success)
            {
                //MessageBox.Show("Exito");
                xIpValida = true;
            }
            else
            {
                xIpValida = false;
                //MessageBox.Show("Error");
            }
            return xIpValida;
        }
        public void solicitarDatos()
        {
            xAcuenta_Fijo = 0;
            xSaldo_Fijo = 0;
            xEfec_Fijo = 0;
            xDepo_Fijo = 0;
            lblEfectivoSol.Text = "0.00";
            lblDepositoSol.Text = "0.00";
            lbltotalSol.Text = "0.00";

            lblefecDolar.Text = "0.00";
            lblDepoDolar.Text = "0.00";
            lblTotalDolarLQ.Text = "0.00";

            txtAcuentaL.Text = "";
            xRegion = string.Empty;
            ximagen3.Visible = true;
            xSoli = 1;
            lblAlmuerzo.Text = "";
            lblidCliente.Text = "";
            lblIdNota.Text = "";

            lblDisponible.Text = "0";
            lblTextDis.Visible = false;
            lblDisponible.Visible = false;

            btnguardar.Enabled = false;
            btneditar.Enabled = false;
            btneliminar.Enabled = false;
            btnactivar.Enabled = true;

            //liquidacion

            btnActivarB.Enabled = true;
            btnGuardarB.Enabled = false;
            //
            tabPage6.Parent = null;
            desactivarCajas();
            this.lblIdNota.Text = Convert.ToString(gvpanel.CurrentRow.Cells[1].Value);
            this.cmdServicios.Text = Convert.ToString(gvpanel.CurrentRow.Cells[4].Value);            
            xRegion= Convert.ToString(gvpanel.CurrentRow.Cells[51].Value);
            traerVisitas(xlistas[1]);
            this.cmdRegion.Text = Convert.ToString(gvpanel.CurrentRow.Cells[52].Value);
            traerHoPa();
            traerPartidas();
            listarB();
            this.cmdPartidas.Text = Convert.ToString(gvpanel.CurrentRow.Cells[3].Value);
            this.dtimeFechaViaje.Text = Convert.ToString(gvpanel.CurrentRow.Cells[5].Value);
            this.txtregistro.Text = Convert.ToString(gvpanel.CurrentRow.Cells[6].Value);
            this.lblidCliente.Text = Convert.ToString(gvpanel.CurrentRow.Cells[7].Value);
            this.txtHoraPar.Text = Convert.ToString(gvpanel.CurrentRow.Cells[8].Value);
            this.txtcliente.Text = Convert.ToString(gvpanel.CurrentRow.Cells[9].Value);
            this.txtcelular.Text = Convert.ToString(gvpanel.CurrentRow.Cells[10].Value);
            this.txtusuario.Text = Convert.ToString(gvpanel.CurrentRow.Cells[11].Value);
            this.txtCantPasajeros.Text = Convert.ToString(gvpanel.CurrentRow.Cells[12].Value);
            this.cmdCondicion.Text = Convert.ToString(gvpanel.CurrentRow.Cells[17].Value);
            this.cmdMedioPago.Text = Convert.ToString(gvpanel.CurrentRow.Cells[18].Value);
            this.txtTotalPagar.Text = Convert.ToString(gvpanel.CurrentRow.Cells[19].Value);
            
            this.txtAcuenta.Text = Convert.ToString(gvpanel.CurrentRow.Cells[20].Value);
            xAcuenta_Fijo= Convert.ToDouble(gvpanel.CurrentRow.Cells[20].Value);

            this.txtSaldo.Text = Convert.ToString(gvpanel.CurrentRow.Cells[21].Value);
            xSaldo_Fijo = Convert.ToDouble(gvpanel.CurrentRow.Cells[21].Value);
            
            this.cmdAuxiliar.Text = Convert.ToString(gvpanel.CurrentRow.Cells[22].Value);
            this.txtObservaciones.Text = Convert.ToString(gvpanel.CurrentRow.Cells[23].Value);
            this.txtIGV.Text = Convert.ToString(gvpanel.CurrentRow.Cells[26].Value);
            this.txtCargos.Text = Convert.ToString(gvpanel.CurrentRow.Cells[27].Value);
            this.txtSerie.Text = Convert.ToString(gvpanel.CurrentRow.Cells[31].Value);
            this.txtnroDoc.Text = Convert.ToString(gvpanel.CurrentRow.Cells[32].Value);     
            this.txtefectivo.Text = Convert.ToString(gvpanel.CurrentRow.Cells[33].Value);
            this.txtdeposito.Text = Convert.ToString(gvpanel.CurrentRow.Cells[34].Value);
            xEfec_Fijo = Convert.ToDouble(gvpanel.CurrentRow.Cells[33].Value);
            xDepo_Fijo = Convert.ToDouble(gvpanel.CurrentRow.Cells[34].Value);
            this.cmdEntidad.Text = Convert.ToString(gvpanel.CurrentRow.Cells[35].Value);
            this.txtNroOperacion.Text = Convert.ToString(gvpanel.CurrentRow.Cells[36].Value);
            this.txttelefono.Text = Convert.ToString(gvpanel.CurrentRow.Cells[37].Value);
            this.txtVisitasExcursion.Text = Convert.ToString(gvpanel.CurrentRow.Cells[38].Value);
            this.txtExtraSol.Text = Convert.ToString(gvpanel.CurrentRow.Cells[39].Value);
            this.txtExtraDol.Text = Convert.ToString(gvpanel.CurrentRow.Cells[40].Value);
            this.dtimeFechaAdelanto.Text = Convert.ToString(gvpanel.CurrentRow.Cells[41].Value);
            this.txtotroPuntoPartida.Text = Convert.ToString(gvpanel.CurrentRow.Cells[42].Value);
            this.cmdIgv.Text = Convert.ToString(gvpanel.CurrentRow.Cells[43].Value);
            this.cmdCargos.Text = Convert.ToString(gvpanel.CurrentRow.Cells[44].Value);
            this.cmdmoneda.Text = Convert.ToString(gvpanel.CurrentRow.Cells[45].Value);
            this.txtruta.Text = Convert.ToString(gvpanel.CurrentRow.Cells[47].Value);
            this.txtDni.Text = Convert.ToString(gvpanel.CurrentRow.Cells[48].Value);
            this.cmdDocumento.Text = Convert.ToString(gvpanel.CurrentRow.Cells[49].Value);
            this.cmdHotel.Text = Convert.ToString(gvpanel.CurrentRow.Cells[50].Value);

            AccesoDatos daSQL = new AccesoDatos("con");
            daSQL.ejecutarConsulta("delete from LiquidacionFullDay where NotaId=" + this.lblIdNota.Text + " and Estado='P'");

            double xExtraA = 0;
            string xTextoMoneda = string.Empty;
            double xOtraExtra = 0;
            string xMonExtra = string.Empty;

            if (cmdmoneda.Text == "SOLES")
            {
                xExtraA = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xTextoMoneda = "S/ ";
                xOtraExtra = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xMonExtra = "$ ";
            }
            else
            {
                xExtraA = (txtExtraDol.Text.Length == 0) ? 0 : double.Parse(txtExtraDol.Text);
                xTextoMoneda = "$ ";
                xOtraExtra = (txtExtraSol.Text.Length == 0) ? 0 : double.Parse(txtExtraSol.Text);
                xMonExtra = "S/ ";
            }

            if (decimal.Parse(txtSaldo.Text) > 0)
            {
                ximagen.BackColor = Color.FromArgb(192, 0, 0);
                lblMensaje.BackColor = Color.FromArgb(192, 0, 0);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text;
                }
                else
                {
                    lblMensaje.Text = "El Pasajero Si \nTiene Deuda " + xTextoMoneda + " -" + txtSaldo.Text + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
            else
            {
                ximagen.BackColor = Color.FromArgb(48, 84, 150);
                lblMensaje.BackColor = Color.FromArgb(48, 84, 150);
                if (xOtraExtra == 0)
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda";
                }
                else
                {
                    lblMensaje.Text = "El Pasajero No \nTiene Deuda" + "\nExtra " + xMonExtra + xOtraExtra.ToString("N2");
                }
            }
            ximagen3.Image = null;
            //if (validaIP() == true)
            //{
            //    if (this.txtruta.Text == ImageNula)
            //    {
            //        ximagen3.Image = null;
            //    }
            //    else
            //    {
            //        try
            //        {
            //            StreamReader stream = new StreamReader(Convert.ToString(gvpanel.CurrentRow.Cells[47].Value));
            //            ximagen3.Image = Image.FromStream(stream.BaseStream);
            //            stream.Close();
            //        }
            //        catch (Exception ex) { ex.ToString(); ximagen3.Image = null; }
            //    }
            //}
            //else
            //{
            //    ximagen3.Image = null;
            //}
            if (cmdmoneda.Text == "SOLES")
            {
                lblTextoPagar.Text = "TOTAL A PAGAR S/ :";
                lblTextoSaldo.Text = "SALDO S/ :";
                lblDepositoTexto.Text = "Deposito S/";
            }
            else
            {
                lblTextoPagar.Text = "TOTAL A PAGAR $ :";
                lblTextoSaldo.Text = "SALDO $ :";
                lblDepositoTexto.Text = "Deposito $";
            }
            btnpdf.Enabled = true;
            btnPDF2.Enabled = true;
            btnAbrirImg.Enabled = true;
            this._PanelPrincipal.Visible =false;
            this.tabControl1.SelectedIndex = 0;
            this.tabControl3.SelectedIndex = 0;
            if (this.cmdCondicion.Text != "CANCELADO") this.tabPage6.Parent = this.tabControl3;
            listaLQ();
            xSoli = 0;
        }
        private void gvpanel_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            try
            {
                if (gvpanel.Rows.Count > 0)
                {
                    if (gvpanel.CurrentCell.ColumnIndex == 0) solicitarDatos();
                }
            }
            catch (Exception ex)
            {
                ex.ToString();
            }
        }
        private void gvpanel_DataBindingComplete(object sender, DataGridViewBindingCompleteEventArgs e)
        {
            try
            {
                if (gvpanel.Rows.Count > 0)
                {
                    int count;
                    for (count = 0; count < gvpanel.Rows.Count; count++)
                    {
                        if (Convert.ToString(gvpanel.Rows[count].Cells[28].Value) == "ANULADO")
                        {
                            gvpanel.Rows[count].DefaultCellStyle.BackColor = Color.LightCoral;
                        }
                        else
                        {
                            if (Convert.ToString(gvpanel.Rows[count].Cells[17].Value) == "CREDITO" && Convert.ToDecimal(gvpanel.Rows[count].Cells[21].Value) > 0)
                                gvpanel.Rows[count].DefaultCellStyle.BackColor = Color.Orange;
                            else
                            {
                                if (Convert.ToDecimal(gvpanel.Rows[count].Cells[21].Value) > 0)
                                    gvpanel.Rows[count].DefaultCellStyle.BackColor = Color.Yellow;
                                else
                                    gvpanel.Rows[count].DefaultCellStyle.BackColor = Color.White;
                            }
                        }
                    }
                }
            }
            catch (Exception ex) { MessageBox.Show(ex.Message); }
        }
        public void botonActivar()
        {
            if (btnactivar.Enabled == true)
            {
                if (btnActivarB.Enabled ==false)
                {
                    MessageBox.Show("PARA EDITAR LA LIQUIDACION PRINCIPAL, LAS LIQUIDACIONES PARCIALES NO DEBEN ESTAR ACTIVA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                }
                else
                {
                    string xfecha, xregistro = string.Empty;
                    xfecha = DateTime.Now.ToString("dd/MM/yyyy");
                    AccesoDatos daSQL = new AccesoDatos("con");
                    string rpt = daSQL.ejecutarComando("validarDatos", "@NotaId", lblIdNota.Text);
                    if (!string.IsNullOrEmpty(rpt))
                    {
                        if (rpt.Contains("~") || rpt.Contains("0"))
                        {
                            DialogResult resul = new DialogResult();
                            resul = MessageBox.Show("Al activar las cajas alteraras los datos registrados... " +
                                "en realidad deseas modificar los datos", "EDITAR", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
                            if (resul == DialogResult.OK)
                            {
                                activarCajas();

                                btnactivar.Enabled = false;
                                btneditar.Enabled = true;
                                btneliminar.Enabled = true;
                                btnpdf.Enabled = false;
                                btnPDF2.Enabled = false;
                                xregistro = txtregistro.Text.Substring(0, 10);
                                if (!xfecha.Equals(xregistro))
                                {
                                    xAviso = 1;
                                    cmdMedioPago.Enabled = false;
                                    cmdCondicion.Enabled = false;
                                    txtAcuenta.Enabled = false;
                                }
                                if (cmdPartidas.Text.Contains("HOTEL") || cmdPartidas.Text.Contains("OTROS"))
                                {
                                    //txtotroPuntoPartida.Enabled = true;
                                    cmdHotel.Enabled = true;
                                    cmdTraslados.Enabled = true;
                                }
                                else
                                {
                                    //txtotroPuntoPartida.Enabled = false;
                                    cmdHotel.Enabled = false;
                                    cmdTraslados.Enabled = false;
                                    cmdTraslados.Text = "-";
                                }
                                if (cmdmoneda.Text == "SOLES") txtExtraSol.Enabled = true;
                                else txtExtraDol.Enabled = true;
                            }
                        }
                        else
                        {
                            MessageBox.Show("EL DOCUMENTO NO PUEDE SER EDITADO PORQUE YA TIENE UNA LIQUIDACION DE PAGO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                            xAviso = 0;
                        }
                    }
                    else
                    {
                        MessageBox.Show("ERROR AL VALIDAR EL ESTADO DEL DOCUMENTO", "ERROR", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
        }
        private void btnactivar_Click(object sender, EventArgs e)
        {
            botonActivar();
        }
        private void btneditar_Click(object sender, EventArgs e)
        {
            validarEditar();
        }
        public void eliminarPedido()
        {
            if (lblIdNota.Text.Length == 0)
            {
                men.SeleccioneUnDato();
            }
            else
            {
                AccesoDatos daSQL = new AccesoDatos("con");
                string rpt = daSQL.ejecutarComando("eliminarNotaPedido", "@NotaId", this.lblIdNota.Text);
                if (!string.IsNullOrEmpty(rpt))
                {
                    listarFecha();
                    men.EliminoCorrecto();
                    limpiar();
                }
                else
                {
                    men.EliminoError();
                }
            }
        }
        public void botonEliminar()
        {
            DialogResult resul = new DialogResult();
            resul = MessageBox.Show("Esta seguro que Desea Anular el Documento Seleccionado?", "ELIMINAR", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
            if (resul == DialogResult.OK) eliminarPedido();
        }
        private void btneliminar_Click(object sender, EventArgs e)
        {
            botonEliminar();
        }
        private void To_pdfINV()
        {
            TEXTO.Document doc = new TEXTO.Document(TEXTO.PageSize.A4.Rotate(), 10, 10, 10, 10);
            SaveFileDialog saveFileDialog1 = new SaveFileDialog();
            saveFileDialog1.Title = "Guardar Reporte";
            saveFileDialog1.DefaultExt = "pdf";
            saveFileDialog1.Filter = "pdf Files (*.pdf)|*.pdf| All Files (*.*)|*.*";
            saveFileDialog1.FilterIndex = 2;
            saveFileDialog1.RestoreDirectory = true;
            string filename = "";
            if (saveFileDialog1.ShowDialog() == DialogResult.OK)
            {
                filename = saveFileDialog1.FileName;
            }
            if (filename.Trim() != "")
            {
                FileStream file = new FileStream(filename,
                FileMode.OpenOrCreate,
                FileAccess.ReadWrite,
                FileShare.ReadWrite);
                PDFT.PdfWriter.GetInstance(doc, file);
                doc.Open();
                string xtours = txtbuscar.Text;//Convert.ToString(gvpanel.CurrentRow.Cells[4].Value);
                string xtrans = "TRANS :  " + xTransporte;
                string xfecha = "FECHA :  " + dtimeinicio.Text;//Convert.ToString(gvpanel.CurrentRow.Cells[5].Value);
                string xguia =  "GUIA    :  " + xGuia;

                TEXTO.Chunk chunk = new TEXTO.Chunk(xtours, TEXTO.FontFactory.GetFont("Calibri", 10, TEXTO.Font.BOLD));
                doc.Add(new TEXTO.Paragraph(chunk));
                doc.Add(new TEXTO.Paragraph("------------------------------------------------------------------------------------------"));
                doc.Add(new TEXTO.Paragraph(xtrans, TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD)));
                doc.Add(new TEXTO.Paragraph(xfecha, TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD)));
                doc.Add(new TEXTO.Paragraph(xguia, TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD)));
                doc.Add(new TEXTO.Paragraph("                       "));
                GeneraDocumentoINV(doc);
                //doc.Add(new TEXTO.Paragraph("                       "));
                //doc.AddCreationDate();
                generaTotalPAX(doc);
                doc.Close();
                Process.Start(filename);
            }
        }
        public void GeneraDocumentoINV(TEXTO.Document document)
        {
            int i;
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(13);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[13] {10,15,55,30,30,12,12,12,12,40,20,25,40};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 100;
            datatable.DefaultCell.BackgroundColor = (TEXTO.BaseColor.LIGHT_GRAY);
            datatable.AddCell(new TEXTO.Phrase("LQ", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("HR", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("NOMBRES", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("CELULAR", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("COUNTER", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("PAX", TEXTO.FontFactory.GetFont("Calibri", 8)));

            if (txtbuscar.Text == "FULL DAY PARACAS - ICA")
            {
                datatable.AddCell(new TEXTO.Phrase("Islas", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Tubu", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Re.N", TEXTO.FontFactory.GetFont("Calibri", 8)));
            }
            else if (txtbuscar.Text == "FULL DAY LUNAHUANA")
            {
                datatable.AddCell(new TEXTO.Phrase("Cuatr", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Canopy", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Canota", TEXTO.FontFactory.GetFont("Calibri", 8)));
            }
            else if (txtbuscar.Text == "FULL DAY AUCALLAMA - CHANCAY")
            {
                datatable.AddCell(new TEXTO.Phrase("Cast.Cha", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Haci.Hu", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Eco.Par", TEXTO.FontFactory.GetFont("Calibri", 8)));
            }
            else
            {
                datatable.AddCell(new TEXTO.Phrase("Acti.1", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Acti.2", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Acti.3", TEXTO.FontFactory.GetFont("Calibri", 8)));
            }

            datatable.AddCell(new TEXTO.Phrase("RECOJO", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("CONDICION", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("AGENCIA", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("OBSERVACIONES", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.HeaderRows = 1;
            
            
            PDFT.PdfPCell cellLQ, cellHR, cellNombres, cellCelular,
                cellCounter, cellPax, cellIslas, cellTub,cellOtros,cellRecojo, 
                cellCondi, cellAgencia, cellOBS = null;
            int xcount = gvpanel.Rows.Count;
            string xpartida = string.Empty;
            for (i = 0; i < xcount; i++)
            {
                if(gvpanel[28, i].Value.ToString()!="ANULADO")
                {
                    cellLQ = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[1, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellLQ.HorizontalAlignment = 2;
                    cellLQ.UseAscender = false;
                    datatable.AddCell(cellLQ);

                    cellHR = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[8, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7, TEXTO.Font.BOLD, TEXTO.BaseColor.RED)));
                    cellHR.HorizontalAlignment = 1;
                    cellHR.UseAscender = false;
                    datatable.AddCell(cellHR);

                    cellNombres = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[9, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellNombres.HorizontalAlignment = 0;
                    cellNombres.UseAscender = false;
                    datatable.AddCell(cellNombres);

                    cellCelular = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[10, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellCelular.HorizontalAlignment = 0;
                    cellCelular.UseAscender = false;
                    datatable.AddCell(cellCelular);

                    cellCounter = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[11, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellCounter.HorizontalAlignment = 1;
                    cellCounter.UseAscender = false;
                    datatable.AddCell(cellCounter);

                    cellPax = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[12, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellPax.HorizontalAlignment = 1;
                    cellPax.UseAscender = false;
                    datatable.AddCell(cellPax);

                    cellIslas = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[13, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellIslas.HorizontalAlignment = 1;
                    cellIslas.UseAscender = false;
                    datatable.AddCell(cellIslas);

                    cellTub = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[14, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellTub.HorizontalAlignment = 1;
                    cellTub.UseAscender = false;
                    datatable.AddCell(cellTub);

                    cellOtros = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[15, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellOtros.HorizontalAlignment = 1;
                    cellOtros.UseAscender = false;
                    datatable.AddCell(cellOtros);

                    if (gvpanel[16, i].Value.ToString().Contains("MUNICIPALIDAD"))
                    {
                        xpartida = "LOS OLIVOS ";
                    }
                    else if (gvpanel[16, i].Value.ToString().Contains("PLAZA NORTE"))
                    {
                        xpartida = "PZA NORTE ";
                    }
                    else if (gvpanel[16, i].Value.ToString().Contains("AV AVIACION 2420"))
                    {
                        xpartida = "AVIACION ";
                    }
                    else
                    {
                        xpartida = gvpanel[16, i].Value.ToString();
                    }

                    cellRecojo = new PDFT.PdfPCell(new TEXTO.Phrase(xpartida, TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellRecojo.HorizontalAlignment = 1;
                    cellRecojo.UseAscender = false;
                    datatable.AddCell(cellRecojo);

                    if ((gvpanel[17, i].Value.ToString() == "ACUENTA" || gvpanel[17, i].Value.ToString() == "CANCELADO") && Convert.ToDecimal(gvpanel[21, i].Value.ToString()) > 0)
                    {
                        cellCondi = new PDFT.PdfPCell(new TEXTO.Phrase("Debe S/ " + gvpanel[21, i].Value.ToString(),
                            TEXTO.FontFactory.GetFont("Calibri", 7, TEXTO.Font.BOLD, TEXTO.BaseColor.RED)));
                        cellCondi.HorizontalAlignment = 1;
                        cellCondi.UseAscender = false;
                        datatable.AddCell(cellCondi);
                    }
                    else
                    {
                        cellCondi = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[17, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                        cellCondi.HorizontalAlignment = 1;
                        cellCondi.UseAscender = false;
                        datatable.AddCell(cellCondi);
                    }

                    cellAgencia = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[22, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellAgencia.HorizontalAlignment = 1;
                    cellAgencia.UseAscender = false;
                    datatable.AddCell(cellAgencia);

                    cellOBS = new PDFT.PdfPCell(new TEXTO.Phrase(gvpanel[46, i].Value.ToString() + " " + gvpanel[23, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellOBS.HorizontalAlignment = 0;
                    cellOBS.UseAscender = false;
                    datatable.AddCell(cellOBS);

                    datatable.CompleteRow();
                }
            }
            document.Add(datatable);
        }
        public void generaTotalPAX(TEXTO.Document document)
        {
            int xPax = 0;
            foreach (DataGridViewRow row in gvpanel.Rows)
            {
                if (Convert.ToString(row.Cells[28].Value) != "ANULADO")
                {
                    xPax += Convert.ToInt32(row.Cells[12].Value);
                }
            }
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(13);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[13] { 10, 15, 55, 30, 30, 12, 12, 12, 12, 40, 20, 25, 40 };
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 100;
            datatable.DefaultCell.Border = 0;
            datatable.DefaultCell.BorderWidth =0;

            PDFT.PdfPCell cellLQ, cellHR, cellNombres, cellCelular,
                cellCounter, cellPax, cellIslas, cellTub, cellOtros, cellRecojo,
                cellCondi, cellAgencia, cellOBS = null;

            cellLQ = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellLQ.HorizontalAlignment = 2;
            cellLQ.Border = 0;

            cellHR = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellHR.HorizontalAlignment = 1;
            cellHR.Border = 0;

            cellNombres = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellNombres.HorizontalAlignment = 0;
            cellNombres.Border = 0;

            cellCelular = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellCelular.HorizontalAlignment = 0;
            cellCelular.Border = 0;

            cellCounter = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellCounter.HorizontalAlignment = 1;
            cellCounter.Border = 0;

            cellPax = new PDFT.PdfPCell(new TEXTO.Phrase(xPax.ToString("N0"), TEXTO.FontFactory.GetFont("Calibri",8,TEXTO.Font.BOLD)));
            cellPax.HorizontalAlignment = 1;
            cellPax.Border = 0;

            cellIslas = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellIslas.HorizontalAlignment = 1;
            cellIslas.Border = 0;

            cellTub = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellTub.HorizontalAlignment = 1;
            cellTub.Border = 0;


            cellOtros = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellOtros.HorizontalAlignment = 1;
            cellOtros.Border = 0;


            cellRecojo = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellRecojo.HorizontalAlignment = 1;
            cellRecojo.Border = 0;

            cellCondi = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellCondi.HorizontalAlignment = 1;
            cellCondi.Border = 0;

            cellAgencia = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellAgencia.HorizontalAlignment = 1;
            cellAgencia.Border = 0;

            cellOBS = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellOBS.HorizontalAlignment = 0;
            cellOBS.Border = 0;

            datatable.AddCell(cellLQ);
            datatable.AddCell(cellHR);
            datatable.AddCell(cellNombres);
            datatable.AddCell(cellCelular);
            datatable.AddCell(cellCounter);
            datatable.AddCell(cellPax);
            datatable.AddCell(cellIslas);
            datatable.AddCell(cellTub);
            datatable.AddCell(cellRecojo);
            datatable.AddCell(cellCondi);
            datatable.AddCell(cellAgencia);
            datatable.AddCell(cellOBS);
            document.Add(datatable);
        }
        FrmAgregar frmAgregar;
        private void lblimprimir_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            if (gvpanel.Rows.Count == 0)
            {
                men.datosVacios();
            }
            else
            {
                frmAgregar = new FrmAgregar();
                frmAgregar.xListas= xlistas[0].ToString();
                frmAgregar.ShowDialog();
                if(frmAgregar.xAviso == 0)
                {
                    //
                }
                else
                {
                    cmdfiltrar.Text = "Tours";
                    dtimeinicio.Text = frmAgregar.xFecha;
                    dtimefin.Text = frmAgregar.xFecha;
                    txtbuscar.Text = frmAgregar.xServicio;
                    xTransporte = frmAgregar.xTransporte;
                    xGuia = frmAgregar.xGuia;
                    listarFecha();
                    buscarTexto();
                    if (gvpanel.Rows.Count > 0)
                    {
                        To_pdfINV();
                    }
                    else
                    {
                        dtimeinicio.Text = DateTime.Now.ToString("dd/MM/yyyy");
                        dtimefin.Text = DateTime.Now.ToString("dd/MM/yyyy");
                        txtbuscar.Text = "";
                        listar();
                        MessageBox.Show("NO HAY NI UN SERVICIO REGISTRADO EN LA FECHA QUE SELECCIONO (" + dtimeinicio.Text + ")", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        txtbuscar.Focus();
                    }
                }
            }
        }
        public void botonforma()
        {
            if (cmdCondicion.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE PRIMERO LA CONDICION SI ES (CREDITO,ACUENTA O CANCELADO)", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                cmdMedioPago.Text = "(SELECCIONE)";
                cmdCondicion.Focus();
            }
            else
            {
                if (cmdMedioPago.Text == "(SELECCIONE)" || cmdMedioPago.Text == "-")
                {
                    cmdMedioPago.Text = "(SELECCIONE)";
                    cmdEntidad.Text = "-";
                    cmdEntidad.Enabled = false;
                    txtdeposito.Text = "0.00";
                    txtefectivo.Text = "0.00";
                    txtdeposito.Enabled = false;
                    txtefectivo.Enabled = false;
                    txtNroOperacion.Text = "";
                    txtNroOperacion.Enabled = false;
                    men.SeleccioneUnDato();
                }
                else if (cmdMedioPago.Text == "EFECTIVO")
                {
                    cmdEntidad.Text = "-";
                    cmdEntidad.Enabled = false;
                    txtdeposito.Text = "0.00";
                    txtdeposito.Enabled = false;
                    txtefectivo.Enabled = false;
                    txtNroOperacion.Text = "";
                    txtNroOperacion.Enabled = false;
                    txtObservaciones.SelectionStart = txtObservaciones.Text.Length;
                    txtObservaciones.Focus();
                }
                else if (cmdMedioPago.Text == "TARJETA")
                {
                    cmdEntidad.Text = "BCP";
                    cmdEntidad.Enabled = false;
                    if (txtAcuenta.Enabled == false) txtdeposito.Text = txtTotalPagar.Text;
                    else txtdeposito.Text = txtAcuenta.Text;
                    txtdeposito.Enabled = false;
                    txtefectivo.Enabled = false;
                    txtNroOperacion.Enabled = true;
                    txtObservaciones.SelectionStart = txtObservaciones.Text.Length;
                    txtObservaciones.Focus();
                }
                else if (cmdMedioPago.Text == "YAPE")
                {
                    cmdEntidad.Text = "BCP";
                    cmdEntidad.Enabled = false;
                    if (txtAcuenta.Enabled == false) txtdeposito.Text = txtTotalPagar.Text;
                    else txtdeposito.Text = txtAcuenta.Text;
                    txtdeposito.Enabled = false;
                    txtefectivo.Enabled = false;
                    txtNroOperacion.Text = "";
                    txtNroOperacion.Enabled = false;
                    txtObservaciones.SelectionStart = txtObservaciones.Text.Length;
                    txtObservaciones.Focus();
                }
                else if (cmdMedioPago.Text == "PLIN")
                {
                    cmdEntidad.Text = "(SELECCIONE)";
                    cmdEntidad.Enabled = true;
                    if (txtAcuenta.Enabled == false) txtdeposito.Text = txtTotalPagar.Text;
                    else txtdeposito.Text = txtAcuenta.Text;
                    txtdeposito.Enabled = false;
                    txtefectivo.Enabled = false;
                    txtNroOperacion.Text = "";
                    txtNroOperacion.Enabled = false;
                    txtObservaciones.SelectionStart = txtObservaciones.Text.Length;
                    txtObservaciones.Focus();
                }
                else if (cmdMedioPago.Text == "TARJETA/EFECTIVO")
                {
                    cmdEntidad.Text = "BCP";
                    cmdEntidad.Enabled = false;
                    txtdeposito.Text = "";
                    txtefectivo.Text = "";
                    txtefectivo.Enabled = true;
                    txtNroOperacion.Enabled = true;
                }
                else if (cmdMedioPago.Text == "YAPE/EFECTIVO")
                {
                    cmdEntidad.Text = "BCP";
                    cmdEntidad.Enabled = false;
                    txtdeposito.Text = "";
                    txtefectivo.Text = "";
                    txtefectivo.Enabled = true;
                    txtNroOperacion.Enabled =false;
                }
                else if (cmdMedioPago.Text == "PLIN/EFECTIVO")
                {
                    cmdEntidad.Text = "(SELECCIONE)";
                    cmdEntidad.Enabled =true;
                    txtdeposito.Text = "";
                    txtefectivo.Text = "";
                    txtefectivo.Enabled = true;
                    txtNroOperacion.Enabled = false;
                    cmdEntidad.Focus();
                }
                else if (cmdMedioPago.Text == "EFECTIVO/DEPOSITO")
                {
                    cmdEntidad.Text = "(SELECCIONE)";
                    cmdEntidad.Enabled = true;
                    txtdeposito.Text = "";
                    txtefectivo.Text = "";
                    txtefectivo.Enabled = true;
                    txtNroOperacion.Enabled = true;
                    cmdEntidad.Focus();
                }
                else
                {
                    cmdEntidad.Text = "(SELECCIONE)";
                    cmdEntidad.Enabled = true;
                    if (txtAcuenta.Enabled == false) txtdeposito.Text = txtTotalPagar.Text;
                    else txtdeposito.Text = txtAcuenta.Text;
                    txtdeposito.Enabled = false;
                    txtefectivo.Enabled = false;
                    txtNroOperacion.Enabled = true;
                }
                total();
            }
        }
        private void cmdMedioPago_SelectionChangeCommitted(object sender, EventArgs e)
        {
            botonforma();
        }
        private void txtNroOperacion_TextChanged(object sender, EventArgs e)
        {
            txtNroOperacion.CharacterCasing = CharacterCasing.Upper;
        }
        private void txtNroOperacion_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtdeposito.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        public void calcularDeposito()
        {
            double vacuenta = 0;
            double vefectivo = 0;
            double vdepo = 0;
            //double vpagar = 0;
            double vpromedio = 0;

            //vpagar = double.Parse(txtTotalPagar.Text);

            if (txtAcuenta.Text.Length == 0) vacuenta = 0;
            else vacuenta = double.Parse(txtAcuenta.Text);

            if (txtdeposito.Text.Length == 0) vdepo = 0;
            else vdepo = double.Parse(txtdeposito.Text);

            if (txtefectivo.Text.Length == 0) vefectivo = 0;
            else vefectivo = double.Parse(txtefectivo.Text);

            vpromedio = vefectivo + vdepo;

            if (vdepo > vacuenta)
            {
                MessageBox.Show("EL DEPOSITO NO PUEDE SER MAYOR AL MONTO TOTAL DE PAGO..!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtdeposito.Text = "";
                txtdeposito.Focus();
            }
            else
            {
                if (vpromedio > vacuenta)
                {
                    MessageBox.Show("LA SUMA DEL ACUENTA CON EL DEPOSITO SUPERA AL MONTO TOTAL DE PAGO..!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtdeposito.Text = "";
                    txtdeposito.Focus();
                }
            }
        }
        public void calcularEfectivo()
        {
            if (txtAcuenta.Text.Length > 0)
            {
                double vacuenta = 0;
                double vefectivo = 0;
                double vdepo = 0;

                if (txtAcuenta.Text.Length == 0) vacuenta = 0;
                else vacuenta = double.Parse(txtAcuenta.Text);

                if (txtefectivo.Text.Length == 0) vefectivo = 0;
                else vefectivo = double.Parse(txtefectivo.Text);

                vdepo = vacuenta - vefectivo;

                if (vefectivo > vacuenta)
                {
                    MessageBox.Show("EL EFECTIVO NO PUEDE SER MAYOR AL MONTO TOTAL DE PAGO..!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtefectivo.Text = "";
                    txtdeposito.Text = "";
                    txtefectivo.Focus();
                }
                else
                {
                    txtdeposito.Text = (vefectivo == 0) ? "0.00" : vdepo.ToString("N2");
                }
            }
            else
            {
                if (txtefectivo.Text.Length > 0)
                {
                    MessageBox.Show("INGRESE PRIMERO EL ACUENTA QUE LE DIO EL CLIENTE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                txtefectivo.Text = "";
                txtdeposito.Text = "";
                if (txtAcuenta.Enabled == true) txtAcuenta.Focus();
            }
        }
        private void txtdeposito_TextChanged(object sender, EventArgs e)
        {
            if (txtdeposito.Enabled == true) calcularDeposito();
        }
        private void txtdeposito_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                if (txtefectivo.Enabled == true) txtefectivo.Focus();
                else txtObservaciones.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtdeposito.Text.Length; i++)
            {
                if (txtdeposito.Text[i] == '.')
                    IsDec = true;
                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void txtdeposito_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up|| e.KeyCode == Keys.ShiftKey)txtNroOperacion.Focus();
        }
        private void cmdEntidad_SelectionChangeCommitted(object sender, EventArgs e)
        {
            if (cmdMedioPago.Text == "DEPOSITO" && cmdEntidad.Text == "-")
            {
                MessageBox.Show("SELECCIONE LA ENTIDAD BANCARIA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                cmdEntidad.Text = "(SELECCIONE)";
            }
            else
            {
                if (txtNroOperacion.Enabled == true) txtNroOperacion.Focus();
            }
        }
        private void txtefectivo_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtObservaciones.Focus();
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtefectivo.Text.Length; i++)
            {
                if (txtefectivo.Text[i] == '.')
                    IsDec = true;
                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void txtefectivo_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up || e.KeyCode == Keys.ShiftKey) txtdeposito.Focus();
        }
        private void txtefectivo_TextChanged(object sender, EventArgs e)
        {
            if (txtefectivo.Enabled == true) calcularEfectivo();
        }
        private void cmdmoneda_SelectionChangeCommitted(object sender, EventArgs e)
        {
            if (cmdmoneda.Text == "SOLES")
            {
                lblTextoPagar.Text = "TOTAL A PAGAR S/ :";
                lblTextoSaldo.Text = "SALDO S/ :";
                lblDepositoTexto.Text = "Deposito S/";
                txtExtraSol.Text = "";
                //txtExtraSol.Enabled = true;
                txtExtraDol.Text = "";
                //txtExtraDol.Enabled =false;
            }
            else
            {
                lblTextoPagar.Text = "TOTAL A PAGAR $ :";
                lblTextoSaldo.Text = "SALDO $ :";
                lblDepositoTexto.Text = "Deposito $";

                txtExtraSol.Text = "";
                //txtExtraSol.Enabled =false;
                txtExtraDol.Text = "";
                //txtExtraDol.Enabled =true;
            }
            if (cmdServicios.Text == "(SELECCIONE)")
            {
                MessageBox.Show("FAVOR DE SELECCIONAR PRIMERO UN TOURS...", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                cmdServicios.Focus();
            }
            else
            {
                xflacMon = 1;
                traerVisitas(xlistas[1]);
                xflacMon = 0;
                if (cmdActividades.Text != "(SELECCIONE)" || cmdActividades.Text != "-") traerPrecio(xlistas[6]);
                if (cmdActividades_2.Text != "(SELECCIONE)" || cmdActividades_2.Text != "-") traerPrecio2(xlistas[6]);
                if (cmdAlmuerzo.Text != "(SELECCIONE)" || cmdAlmuerzo.Text != "-") traerAlmuerzo(xlistas[10]);
                if (cmdTraslados.Text != "(SELECCIONE)" || cmdTraslados.Text != "-") traerPrecioTras(xlistas[11]);
            }
        }
        //traer precios de traslados

        public void traerPrecioTras(string data)
        {
            xflac = 1;
            if (cmdTraslados.SelectedValue.ToString() != "0")
            {
                if (txtCantPasajeros.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE PRIMERO LA CANTIDAD DE PASAJEROS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtCantPasajeros.Focus();
                    cmdTraslados.Text = "(SELECCIONE)";
                }
                else
                {
                    txtSubTotal_5.Text = "";
                    string[] registros = data.Split('¬');
                    int nRegistros = registros.Length;
                    string[] campos;
                    decimal xsoles= 0;
                    decimal xdolares = 0;
                    decimal xprecios = 0;
                    var idCabezera = cmdTraslados.SelectedValue.ToString();
                    for (int i = 0; i < nRegistros; i++)
                    {
                        campos = registros[i].Split('|');
                        if (campos[0] == "~") break;
                        else
                        {
                            if (idCabezera == campos[0])
                            {
                                xsoles= decimal.Parse(campos[1]);
                                xdolares = decimal.Parse(campos[2]);

                                xprecios = (cmdmoneda.Text == "SOLES") ? xsoles : xdolares;

                                txtPrecio_5.Text = xprecios.ToString("N2");
                                txtCan5.Text =txtCantPasajeros.Text;
                                txtSubTotal_5.Text = (decimal.Parse(txtCan5.Text) * xprecios).ToString("N2");

                                txtPrecio_5.Enabled = true;
                                txtCan5.Enabled = true;
                                break;
                            }
                        }
                    }
                    txtCan5.SelectionStart = txtCan5.Text.Length;
                    txtCan5.Focus();
                }
            }
            else
            {
                txtPrecio_5.Enabled = false;
                txtCan5.Enabled = false;
                txtPrecio_5.Text = "";
                txtCan5.Text = "";
                txtSubTotal_5.Text = "";
            }
            total();
        }
        public void traerAlmuerzo(string data)
        {
            xflac = 1;
            xtotalEnAl = 0;
            lblAlmuerzo.Text = "";
            if (cmdAlmuerzo.SelectedValue.ToString() != "0")
            {
                if (txtCantPasajeros.Text.Length == 0)
                {
                    MessageBox.Show("INGRESE PRIMERO LA CANTIDAD DE PASAJEROS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    txtCantPasajeros.Focus();
                    cmdAlmuerzo.Text = "(SELECCIONE)";
                }
                else
                {
                    txtSubTotal_1.Text = "";
                    string[] registros = data.Split('¬');
                    int nRegistros = registros.Length;
                    string[] campos;
                    decimal xsoles = 0;
                    decimal xdolares = 0;
                    decimal xprecios = 0;
                    decimal xCantidadPX = 0;
                    decimal xPrecioFinal = 0;
                    decimal xsub_1 = 0;
                    xCantidadPX =(txtCantPasajeros.Text.Length==0)?0:decimal.Parse(txtCantPasajeros.Text);
                    var idCabezera = cmdAlmuerzo.SelectedValue.ToString();
                    for (int i = 0; i < nRegistros; i++)
                    {
                        campos = registros[i].Split('|');
                        if (campos[0] == "~") break;
                        else
                        {
                            if (idCabezera == campos[0])
                            {
                                xsoles = decimal.Parse(campos[1]);
                                xdolares = decimal.Parse(campos[2]);
                                xprecios = (cmdmoneda.Text == "SOLES") ? xsoles : xdolares;                               
                                break;
                            }
                        }
                    }
                    if (xprecios > 0)
                    {
                        xtotalEnAl = xprecios * xCantidadPX;
                        xPrecioFinal = xPrecioTours + xtotalEnAl;
                        txtPrecio_1.Text = xPrecioFinal.ToString("N2");
                        lblAlmuerzo.Text = xprecios.ToString("N2");
                        xsub_1 = xPrecioFinal * xCantidadPX;
                        txtSubTotal_1.Text = xsub_1.ToString("N2");
                    }
                    else
                    {
                        txtPrecio_1.Text = xPrecioTours.ToString("N2");
                        lblAlmuerzo.Text = "";
                        xsub_1 = xPrecioTours * xCantidadPX;
                        txtSubTotal_1.Text = xsub_1.ToString("N2");
                    }
                }
            }
            else
            {
                //
            }
            total();
        }
        private void cmdAlmuerzo_SelectionChangeCommitted(object sender, EventArgs e)
        {
            if (cmdAlmuerzo.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE SI INCLUYE ALMUERZO EL TOURS", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdAlmuerzo.Text = "(SELECCIONE)";
                cmdAlmuerzo.Focus();
            }
            else if (txtPrecio_1.Text.Length==0)
            {
                MessageBox.Show("SELECCIONE PRIMERO EL TOURS QUE VA REALIZAR EL CLIENTE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Error);
                cmdAlmuerzo.Text = "(SELECCIONE)";
                cmdServicios.Focus();
            }
            else
            {
                traerAlmuerzo(xlistas[10]);
            }
        }
        public void eliminarArchivos()
        {
            xErrorArchivo = 0;
            string temPDF = string.Empty;
            string xarchivo = string.Empty;
            DateTime dfecha = Convert.ToDateTime(dtimeFechaViaje.Value.ToString("dd/MM/yyyy"));
            string xfecha = dfecha.ToString("dd-MM-yyyy");
            xarchivo = String.Format("{0}_{1}_{2}_{3}.PDF", xfecha, "FullDay", "ID", lblIdNota.Text);
            temPDF = "\\\\" + xconexion.xPC_Personal + "\\ArchivoSistema\\FullDay\\" + xarchivo;
            try
            {
                File.Delete(temPDF);
            }
            catch (Exception ex)
            {
                ex.ToString();
                xErrorArchivo = 1;
            }
        }
        private void exportarPDF()
        {
            eliminarArchivos();
            if (xErrorArchivo == 0)
            {
                TEXTO.Document doc = new TEXTO.Document(TEXTO.PageSize.A4, 10, 10, 10, 10);
                string filename, xarchivo = string.Empty;
                DateTime dfecha = Convert.ToDateTime(dtimeFechaViaje.Value.ToString("dd/MM/yyyy"));
                string xfecha = dfecha.ToString("dd-MM-yyyy");
                xarchivo = String.Format("{0}_{1}_{2}_{3}.PDF", xfecha, "FullDay", "ID", lblIdNota.Text);
                filename = "\\\\" + xconexion.xPC_Personal + "\\ArchivoSistema\\FullDay\\" + xarchivo;
                if (filename.Trim() != "")
                {
                    FileStream file = new FileStream(filename,
                FileMode.OpenOrCreate,
                FileAccess.ReadWrite,
                FileShare.ReadWrite);
                    PDFT.PdfWriter writer = PDFT.PdfWriter.GetInstance(doc, file);
                    doc.Open();
                    string xruta = string.Empty;
                    xruta = "\\\\" + xconexion.xPC_Personal + "\\ArchivoSistema\\Logo\\LogoReport.PNG";
                    TEXTO.Image imagen = TEXTO.Image.GetInstance(xruta);
                    imagen.BorderWidth = 0;
                    imagen.SetAbsolutePosition(10f,765f);
                    imagen.ScalePercent(32);
                    doc.Add(imagen);
                    doc.Add(new TEXTO.Paragraph("                       "));
                    doc.Add(new TEXTO.Paragraph("                       "));
                    doc.Add(new TEXTO.Paragraph("                       "));
                    doc.Add(new TEXTO.Paragraph("                       "));
                    doc.Add(new TEXTO.Paragraph(" "+cmdServicios.Text, TEXTO.FontFactory.GetFont("Calibri",11, TEXTO.Font.BOLD)));
                    doc.Add(new TEXTO.Paragraph("                       ", TEXTO.FontFactory.GetFont("Calibri", 8, TEXTO.Font.BOLD)));
                    GeneraCabezera(doc);
                    doc.Add(new TEXTO.Paragraph("                       "));
                    doc.Add(new TEXTO.Paragraph(" CONTACTO Y ACTIVIDADES DEL PAX :",TEXTO.FontFactory.GetFont("Calibri",9, TEXTO.Font.BOLD)));
                    doc.Add(new TEXTO.Paragraph("                       ",TEXTO.FontFactory.GetFont("Calibri",6, TEXTO.Font.BOLD)));
                    GeneraContacto(doc);
                    doc.Add(new TEXTO.Paragraph("                       ", TEXTO.FontFactory.GetFont("Calibri",6, TEXTO.Font.BOLD)));
                    GeneraActividad(doc);
                    doc.Add(new TEXTO.Paragraph("                       ", TEXTO.FontFactory.GetFont("Calibri", 8, TEXTO.Font.BOLD)));
                    doc.Add(new TEXTO.Paragraph(" DETALLE DEL SERVICIO TURISTICO :", TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD)));
                    doc.Add(new TEXTO.Paragraph("                       ", TEXTO.FontFactory.GetFont("Calibri",6, TEXTO.Font.BOLD)));
                    GeneraPartida(doc);
                    GeneraExcurion(doc);
                    GeneraCabDetalle(doc);
                    GeneraDetalle(doc);
                    GeneraCargos(doc);
                    GeneraSeparador(doc);
                    doc.Add(new TEXTO.Paragraph("                       ", TEXTO.FontFactory.GetFont("Calibri",8, TEXTO.Font.BOLD)));
                    doc.Add(new TEXTO.Paragraph(" PRECIO DE LA LIQUIDACION",TEXTO.FontFactory.GetFont("Calibri",9, TEXTO.Font.BOLD)));
                    GeneraTotal(doc);
                    doc.Add(new TEXTO.Paragraph("                       ",TEXTO.FontFactory.GetFont("Calibri",7, TEXTO.Font.BOLD)));
                    GeneraOBS(doc);
                    doc.Close();
                    Process.Start(filename);
                }
            }
            else
            {
                MessageBox.Show("Cierre el archivo antes de Generar el nuevo Reporte", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }
        public void GeneraCabezera(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(5);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[5] {35,40,40,35,45};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage =100;
            datatable.DefaultCell.BorderWidth = 0;
            //datatable.DefaultCell.HorizontalAlignment = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            //datatable.DefaultCell.BackgroundColor = (TEXTO.BaseColor.YELLOW);
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.HeaderRows = 1;
            PDFT.PdfPCell cellTex_1, cellTex_2, cellTex_3,
            cellTex_4, cellTex_5,cellTex_6,cellVacio_1,cellVacio_2,cellVacio_3,
            cellFechaViaje, cellAuxiliar, cellTelefono,
            cellRegistro, cellCounter, cellCondicion= null;

            var xColor_1 = new TEXTO.BaseColor(149, 206, 95);
            var xColor_2 = new TEXTO.BaseColor(251, 250, 156);

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" Fecha de Viaje:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_1.HorizontalAlignment = 0;
            cellTex_1.UseAscender = false;
            cellTex_1.Border = 0;
            datatable.AddCell(cellTex_1);

            cellFechaViaje = new PDFT.PdfPCell(new TEXTO.Phrase(dtimeFechaViaje.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellFechaViaje.HorizontalAlignment = 0;
            cellFechaViaje.Border = 0;
            cellFechaViaje.UseAscender = false;
            datatable.AddCell(cellFechaViaje);

            cellVacio_1= new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_1.HorizontalAlignment = 1;
            cellVacio_1.Border = 0;
            cellVacio_1.UseAscender = false;
            datatable.AddCell(cellVacio_1);

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase(" Fecha de Emisión:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_2.HorizontalAlignment = 0;
            cellTex_2.UseAscender = false;
            cellTex_2.Border = 0;
            datatable.AddCell(cellTex_2);

            cellRegistro = new PDFT.PdfPCell(new TEXTO.Phrase(txtregistro.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellRegistro.HorizontalAlignment = 0;
            cellRegistro.Border = 0;
            cellRegistro.UseAscender = false;
            datatable.AddCell(cellRegistro);

            cellTex_3 = new PDFT.PdfPCell(new TEXTO.Phrase(" Canal de Venta:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_3.HorizontalAlignment = 0;
            cellTex_3.Border = 0;
            cellTex_3.UseAscender = false;
            datatable.AddCell(cellTex_3);

            cellAuxiliar= new PDFT.PdfPCell(new TEXTO.Phrase(cmdAuxiliar.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellAuxiliar.HorizontalAlignment = 0;
            cellAuxiliar.UseAscender = false;
            cellAuxiliar.Border = 0;
            datatable.AddCell(cellAuxiliar);

            cellVacio_2 = new PDFT.PdfPCell(new TEXTO.Phrase("  ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_2.HorizontalAlignment = 0;
            cellVacio_2.Border = 0;
            cellVacio_2.UseAscender = false;
            datatable.AddCell(cellVacio_2);

            cellTex_6 = new PDFT.PdfPCell(new TEXTO.Phrase(" Counter:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_6.HorizontalAlignment = 0;
            cellTex_6.Border = 0;
            cellTex_6.UseAscender = false;
            datatable.AddCell(cellTex_6);

            cellCounter = new PDFT.PdfPCell(new TEXTO.Phrase(txtusuario.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCounter.HorizontalAlignment = 0;
            cellCounter.Border = 0;
            cellCounter.UseAscender = false;
            datatable.AddCell(cellCounter);
            //

            cellTex_4= new PDFT.PdfPCell(new TEXTO.Phrase(" Teléfonos:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_4.HorizontalAlignment = 0;
            cellTex_4.UseAscender = false;
            cellTex_4.Border = 0;
            datatable.AddCell(cellTex_4);

            cellTelefono= new PDFT.PdfPCell(new TEXTO.Phrase(txttelefono.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTelefono.HorizontalAlignment = 0;
            cellTelefono.UseAscender = false;
            cellTelefono.Border = 0;
            datatable.AddCell(cellTelefono);

            cellVacio_3 = new PDFT.PdfPCell(new TEXTO.Phrase("  ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_3.HorizontalAlignment = 0;
            cellVacio_3.Border = 0;
            cellVacio_3.UseAscender = false;
            datatable.AddCell(cellVacio_3);

            cellTex_5 = new PDFT.PdfPCell(new TEXTO.Phrase(" Condición:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_5.HorizontalAlignment = 0;
            cellTex_5.Border = 0;
            cellTex_5.UseAscender = false;
            datatable.AddCell(cellTex_5);

            cellCondicion= new PDFT.PdfPCell(new TEXTO.Phrase(cmdCondicion.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCondicion.HorizontalAlignment = 0;
            cellCondicion.UseAscender = false;
            cellCondicion.Border = 0;
            datatable.AddCell(cellCondicion);
            //
            document.Add(datatable);
        }
        //
        public void GeneraContacto(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(4);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[4] {55,30,30,20};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage =96;
            datatable.DefaultCell.BorderWidth = 0;
            //datatable.DefaultCell.HorizontalAlignment = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            //datatable.DefaultCell.BackgroundColor = (TEXTO.BaseColor.YELLOW);
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.HeaderRows = 1;
            PDFT.PdfPCell cellTex_1, cellTex_2, cellTex_3,cellTex_4,
            cellContacto,cellDNI,cellCelular, cellCantPax= null;

            var xColor_1 = new TEXTO.BaseColor(Color.Black);
            var xColor_2 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#faf3e4"));

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase("Nombre y Apellido del Pasajero", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_1.HorizontalAlignment =1;
            cellTex_1.BackgroundColor = xColor_1;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase("D.N.I / Pasaporte", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_2.HorizontalAlignment =1;
            cellTex_2.BackgroundColor = xColor_1;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            cellTex_3 = new PDFT.PdfPCell(new TEXTO.Phrase("Cant de PAX", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_3.HorizontalAlignment = 1;
            cellTex_3.BackgroundColor = xColor_1;
            cellTex_3.UseAscender = false;
            datatable.AddCell(cellTex_3);

            cellTex_4= new PDFT.PdfPCell(new TEXTO.Phrase("Cant de PAX", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.BaseColor.WHITE)));
            cellTex_4.HorizontalAlignment = 1;
            cellTex_4.BackgroundColor = xColor_1;
            cellTex_4.UseAscender = false;
            datatable.AddCell(cellTex_4);

            cellContacto = new PDFT.PdfPCell(new TEXTO.Phrase(txtcliente.Text.ToUpper(), TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellContacto.HorizontalAlignment = 1;
            cellContacto.BackgroundColor = xColor_2;
            cellContacto.UseAscender = false;
            datatable.AddCell(cellContacto);

            cellDNI = new PDFT.PdfPCell(new TEXTO.Phrase(txtDni.Text.ToUpper(), TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellDNI.HorizontalAlignment = 1;
            cellDNI.BackgroundColor = xColor_2;
            cellDNI.UseAscender = false;
            datatable.AddCell(cellDNI);

            cellCelular = new PDFT.PdfPCell(new TEXTO.Phrase(txtcelular.Text.ToUpper(), TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCelular.HorizontalAlignment = 1;
            cellCelular.BackgroundColor = xColor_2;
            cellCelular.UseAscender = false;
            datatable.AddCell(cellCelular);

            cellCantPax= new PDFT.PdfPCell(new TEXTO.Phrase(txtCantPasajeros.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCantPax.HorizontalAlignment = 1;
            cellCantPax.BackgroundColor = xColor_2;
            cellCantPax.UseAscender = false;
            datatable.AddCell(cellCantPax);
            //
            document.Add(datatable);
        }
        //
        public void GeneraActividad(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(5);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[5] {39,75,15,30,25};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage =96;
            datatable.DefaultCell.BorderWidth = 0;
            //datatable.DefaultCell.HorizontalAlignment = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            //datatable.DefaultCell.BackgroundColor = (TEXTO.BaseColor.YELLOW);
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.HeaderRows = 1;
            PDFT.PdfPCell cellTex_1, cellTex_2, cellTex_3,
            cellTex_4, cellTex_5, cellTex_6, cellVacio_1, cellVacio_2, cellVacio_3,
            cellActividad_1, cellActividad_2, cellActividad_3,
            cellCant_1,cellCant_2, cellCant_3= null;

            var xColor_1 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#42444a"));
            var xColor_2 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));
            var xColor_Blanco = new TEXTO.BaseColor(ColorTranslator.FromHtml("#ffffff"));

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" Actividades Opcionales 1", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_1.HorizontalAlignment = 0;
            cellTex_1.Border= 0;
            cellTex_1.BorderColor = xColor_Blanco;
            cellTex_1.BackgroundColor = xColor_1;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellActividad_1 = new PDFT.PdfPCell(new TEXTO.Phrase(cmdActividades.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellActividad_1.HorizontalAlignment = 0;
            //cellActividad_1.Border = 0;
            cellActividad_1.BorderColor =xColor_Blanco;
            cellActividad_1.BackgroundColor = xColor_2;
            cellActividad_1.UseAscender = false;
            datatable.AddCell(cellActividad_1);

            cellVacio_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" -> ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_1.HorizontalAlignment = 1;
            //cellVacio_1.Border = 0;
            cellVacio_1.BorderColor =xColor_Blanco;
            cellVacio_1.UseAscender = false;
            datatable.AddCell(cellVacio_1);

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase(" Cantidad Activ.", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_2.HorizontalAlignment = 0;
            cellTex_2.Border = 0;
            cellTex_2.BorderColor=xColor_Blanco;
            cellTex_2.BackgroundColor = xColor_1;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);


            string xcant2 = string.Empty;
            string xcant3 = string.Empty;
            string xcant4 = string.Empty;
            xcant2=(cmdActividades.Text == "-")?"": txtCan2.Text;
            xcant3=(cmdActividades_2.Text == "-")?"": txtCan3.Text;
            xcant4=(cmdActividades_3.Text == "-")?"": txtCan4.Text;

            cellCant_1 = new PDFT.PdfPCell(new TEXTO.Phrase(xcant2, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_1.HorizontalAlignment =1;
            cellCant_1.Border = 0;
            cellCant_1.BorderColor =xColor_Blanco;
            cellCant_1.BackgroundColor = xColor_2;
            cellCant_1.UseAscender = false;
            datatable.AddCell(cellCant_1);
            //
            cellTex_3= new PDFT.PdfPCell(new TEXTO.Phrase(" Actividades Opcionales 2", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_3.HorizontalAlignment = 0;
            cellTex_3.Border = 0;
            cellTex_3.BorderColor =xColor_Blanco;
            cellTex_3.BackgroundColor = xColor_1;
            cellTex_3.UseAscender = false;
            datatable.AddCell(cellTex_3);

            cellActividad_2= new PDFT.PdfPCell(new TEXTO.Phrase(cmdActividades_2.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellActividad_2.HorizontalAlignment = 0;
            //cellActividad_2.Border = 0;
            cellActividad_2.BorderColor =xColor_Blanco;
            cellActividad_2.BackgroundColor = xColor_2;
            cellActividad_2.UseAscender = false;
            datatable.AddCell(cellActividad_2);

            cellVacio_2= new PDFT.PdfPCell(new TEXTO.Phrase(" -> ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_2.HorizontalAlignment = 1;
            //cellVacio_2.Border = 0;
            cellVacio_2.BorderColor =xColor_Blanco;
            cellVacio_2.UseAscender = false;
            datatable.AddCell(cellVacio_2);

            cellTex_4= new PDFT.PdfPCell(new TEXTO.Phrase(" Cantidad Activ.", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.BaseColor.WHITE)));
            cellTex_4.HorizontalAlignment = 0;
            cellTex_4.Border = 0;
            cellTex_4.BorderColor =xColor_Blanco;
            cellTex_4.BackgroundColor = xColor_1;
            cellTex_4.UseAscender = false;
            datatable.AddCell(cellTex_4);

            cellCant_2= new PDFT.PdfPCell(new TEXTO.Phrase(xcant3, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_2.HorizontalAlignment = 1;
            //cellCant_2.Border = 0;
            cellCant_2.BorderColor =xColor_Blanco;
            cellCant_2.BackgroundColor = xColor_2;
            cellCant_2.UseAscender = false;
            datatable.AddCell(cellCant_2);
            //
            cellTex_5 = new PDFT.PdfPCell(new TEXTO.Phrase(" Actividades Opcionales 3", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_5.HorizontalAlignment = 0;
            cellTex_5.Border = 0;
            cellTex_5.BorderColor =xColor_Blanco;
            cellTex_5.BackgroundColor = xColor_1;
            cellTex_5.UseAscender = false;
            datatable.AddCell(cellTex_5);

            cellActividad_3 = new PDFT.PdfPCell(new TEXTO.Phrase(cmdActividades_3.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellActividad_3.HorizontalAlignment = 0;
            //cellActividad_3.Border = 0;
            cellActividad_3.BorderColor =xColor_Blanco;
            cellActividad_3.BackgroundColor = xColor_2;
            cellActividad_3.UseAscender = false;
            datatable.AddCell(cellActividad_3);

            cellVacio_3= new PDFT.PdfPCell(new TEXTO.Phrase(" -> ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_3.HorizontalAlignment = 1;
            //cellVacio_3.Border = 0;
            cellVacio_3.BorderColor =xColor_Blanco;
            cellVacio_3.UseAscender = false;
            datatable.AddCell(cellVacio_3);

            cellTex_6= new PDFT.PdfPCell(new TEXTO.Phrase(" Cantidad Activ.", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_6.HorizontalAlignment = 0;
            cellTex_6.Border = 0;
            cellTex_6.BorderColor=xColor_Blanco;
            cellTex_6.BackgroundColor = xColor_1;
            cellTex_6.UseAscender = false;
            datatable.AddCell(cellTex_6);

            cellCant_3 = new PDFT.PdfPCell(new TEXTO.Phrase(xcant4, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_3.HorizontalAlignment = 1;
            //cellCant_3.Border = 0;
            cellCant_3.BorderColor =xColor_Blanco;
            cellCant_3.BackgroundColor = xColor_2;
            cellCant_3.UseAscender = false;
            datatable.AddCell(cellCant_3);

            document.Add(datatable);
        }
        //
        public void GeneraPartida(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(5);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[5] { 39, 75, 15, 30, 25 };
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            datatable.DefaultCell.BorderWidth = 0;
            //datatable.DefaultCell.HorizontalAlignment = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            //datatable.DefaultCell.BackgroundCoor = (TEXTO.BaseColor.YELLOW);
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.HeaderRows = 1;
            PDFT.PdfPCell cellTex_1, cellTex_2,
            cellVacio_1,cellPartida, cellHora= null;

            var xColor_1 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#42444a"));
            var xColor_2 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));
            var xColor_Blanco = new TEXTO.BaseColor(ColorTranslator.FromHtml("#ffffff"));

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" Punto de Partida", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_1.HorizontalAlignment = 0;
            cellTex_1.Border = 0;
            cellTex_1.BackgroundColor =xColor_1;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellPartida= new PDFT.PdfPCell(new TEXTO.Phrase(cmdPartidas.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellPartida.HorizontalAlignment = 0;
            cellPartida.BackgroundColor = xColor_2;
            cellPartida.BorderColor = xColor_Blanco;
            cellPartida.UseAscender = false;
            datatable.AddCell(cellPartida);

            cellVacio_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_1.HorizontalAlignment = 1;
            cellVacio_1.BorderColor = xColor_Blanco;
            cellVacio_1.UseAscender = false;
            datatable.AddCell(cellVacio_1);

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase(" Hora de Partida", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.BaseColor.WHITE)));
            cellTex_2.HorizontalAlignment = 0;
            cellTex_2.Border = 0;
            cellTex_2.BackgroundColor =xColor_1;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            cellHora= new PDFT.PdfPCell(new TEXTO.Phrase(txtHoraPar.Text.ToUpper(), TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellHora.HorizontalAlignment = 1;
            cellHora.BackgroundColor = xColor_2;
            cellHora.BorderColor = xColor_Blanco;
            cellHora.UseAscender = false;
            datatable.AddCell(cellHora);
            //
            document.Add(datatable);
        }
        //
        public void GeneraExcurion(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(2);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[2] { 39,145};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            datatable.DefaultCell.BorderWidth = 0;
            //datatable.DefaultCell.HorizontalAlignment = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            //datatable.DefaultCell.BackgroundColor = (TEXTO.BaseColor.YELLOW);
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.HeaderRows = 1;
            PDFT.PdfPCell cellTex_1, cellTex_2,
            cellOtroPartida, cellExcursion = null;

            var xColor_1 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#42444a"));
            var xColor_2 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));
            var xColor_Blanco = new TEXTO.BaseColor(ColorTranslator.FromHtml("#ffffff"));

            string xotrasPartidas = string.Empty;
            
            xotrasPartidas = (cmdHotel.Text.Contains("-")) ? txtotroPuntoPartida.Text.Trim() 
            : "HOTEL - " + cmdHotel.Text + " - " + txtotroPuntoPartida.Text.Trim();

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" Otros Puntos de Partida", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_1.HorizontalAlignment = 0;
            cellTex_1.BackgroundColor=xColor_1;
            cellTex_1.Border= 0; 
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellOtroPartida = new PDFT.PdfPCell(new TEXTO.Phrase(xotrasPartidas, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellOtroPartida.HorizontalAlignment = 0;
            cellOtroPartida.BackgroundColor = xColor_2;
            cellOtroPartida.BorderColor =xColor_Blanco;
            cellOtroPartida.UseAscender = false;
            datatable.AddCell(cellOtroPartida);


            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase(" Visitas y \n Excursiones", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_2.HorizontalAlignment =0;
            cellTex_2.BackgroundColor = xColor_1;
            cellTex_2.Border = 0;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            cellExcursion= new PDFT.PdfPCell(new TEXTO.Phrase(txtVisitasExcursion.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellExcursion.HorizontalAlignment =0;
            cellExcursion.BackgroundColor = xColor_2;
            cellExcursion.BorderColor=xColor_Blanco;
            cellExcursion.UseAscender = false;
            datatable.AddCell(cellExcursion);
            //
            document.Add(datatable);
        }
        //
        public void GeneraCabDetalle(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(4);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[4] { 72, 25, 20, 25 };
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            datatable.DefaultCell.BorderWidth = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            datatable.AddCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));

            datatable.HeaderRows = 1;

            PDFT.PdfPCell cellTex_1, cellTex_2,
                cellTex_3, cellTex_4 = null;

            var xColor_2 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));
            var xColor_Naranja = new TEXTO.BaseColor(ColorTranslator.FromHtml("#984f2b"));

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase("DETALLE DE TARIFA :", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_1.HorizontalAlignment = 1;
            cellTex_1.BackgroundColor=xColor_2;
            cellTex_1.Border=0;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase("Precio Unit.", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Naranja)));
            cellTex_2.HorizontalAlignment =1;
            cellTex_2.BackgroundColor = xColor_2;
            cellTex_2.Border = 0;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            cellTex_3 = new PDFT.PdfPCell(new TEXTO.Phrase("Cant.", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Naranja)));
            cellTex_3.HorizontalAlignment = 1;
            cellTex_3.BackgroundColor = xColor_2;
            cellTex_3.Border = 0;
            cellTex_3.UseAscender = false;
            datatable.AddCell(cellTex_3);

            cellTex_4= new PDFT.PdfPCell(new TEXTO.Phrase("Sub Total", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Naranja)));
            cellTex_4.HorizontalAlignment = 1;
            cellTex_4.BackgroundColor = xColor_2;
            cellTex_4.Border = 0;
            cellTex_4.UseAscender = false;
            datatable.AddCell(cellTex_4);
            //
            document.Add(datatable);
        }
        //
        public void GeneraDetalle(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(5);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[5] {20,54, 24, 20, 24};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 95;
            datatable.DefaultCell.BorderWidth = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));

            datatable.HeaderRows = 1;

            PDFT.PdfPCell cellTex_1, cellTex_2,
            cellTex_3, cellTex_4,cellTex_5,cellTex_6,
            cellDes_1, cellDes_2,cellDes_3,cellDes_4,
            cellDes_5, cellDes_6,
            cellPre_1, cellPre_2,cellPre_3,cellPre_4,
            cellPre_5, cellPre_6,
            cellCant_1, cellCant_2, cellCant_3,cellCant_4,
            cellCant_5, cellCant_6,
            cellSub_1, cellSub_2,cellSub_3,cellSub_4,
            cellSub_5, cellSub_6 = null;

            var xColor_1 = new TEXTO.BaseColor(ColorTranslator.FromHtml(" #ea8235"));
            var xColor_Blanco = new TEXTO.BaseColor(ColorTranslator.FromHtml("#ffffff"));

            decimal zPrecio1 = 0;
            decimal zPrecio2 = 0;
            decimal zPrecio3 = 0;
            decimal zPrecio4 = 0;
            decimal zPrecio5 = 0;
            string T_Precio1 =string.Empty;
            string T_Precio2 =string.Empty;
            string T_Precio3 =string.Empty;
            string T_Precio4 =string.Empty;
            string T_Precio5 =string.Empty;

            zPrecio1 = (txtPrecio_1.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_1.Text);
            zPrecio2 = (txtPrecio_2.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_2.Text);
            zPrecio3 = (txtPrecio_3.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_3.Text);
            zPrecio4 = (txtPrecio_4.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_4.Text);
            zPrecio5 = (txtPrecio_5.Text.Length == 0) ? 0 : decimal.Parse(txtPrecio_5.Text);

            T_Precio1=zPrecio1.ToString("N2");
            T_Precio2=zPrecio2.ToString("N2");
            T_Precio3=zPrecio3.ToString("N2");
            T_Precio4=zPrecio4.ToString("N2");
            T_Precio5=zPrecio5.ToString("N2");

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" Tarifa de Tour : ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_1.HorizontalAlignment =0;
            cellTex_1.BackgroundColor=xColor_1;
            cellTex_1.Border = 0;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellDes_1= new PDFT.PdfPCell(new TEXTO.Phrase(cmdAlmuerzo.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellDes_1.HorizontalAlignment =0;
            cellDes_1.Border = 0;
            cellDes_1.UseAscender = false;
            datatable.AddCell(cellDes_1);

            cellPre_1= new PDFT.PdfPCell(new TEXTO.Phrase(T_Precio1, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellPre_1.HorizontalAlignment =2;
            cellPre_1.Border = 0;
            cellPre_1.UseAscender = false;
            datatable.AddCell(cellPre_1);

            cellCant_1= new PDFT.PdfPCell(new TEXTO.Phrase(txtCan1.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_1.HorizontalAlignment =1;
            cellCant_1.Border = 0;
            cellCant_1.UseAscender = false;
            datatable.AddCell(cellCant_1);

            cellSub_1 = new PDFT.PdfPCell(new TEXTO.Phrase(txtSubTotal_1.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellSub_1.HorizontalAlignment = 2;
            cellSub_1.Border = 0;
            cellSub_1.UseAscender = false;
            datatable.AddCell(cellSub_1);
            //

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase(" Actividad 01 : ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_2.HorizontalAlignment = 0;
            cellTex_2.Border = 0;
            cellTex_2.BackgroundColor =xColor_1;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            cellDes_2 = new PDFT.PdfPCell(new TEXTO.Phrase(cmdActividades.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellDes_2.HorizontalAlignment = 0;
            cellDes_2.Border = 0;
            cellDes_2.UseAscender = false;
            datatable.AddCell(cellDes_2);

            string xprecio2 = string.Empty;
            string xcant2 = string.Empty;
            string xsub2 = string.Empty;
            if (cmdActividades.Text == "-")
            {
                xprecio2 = "";
                xcant2 = "";
                xsub2 = "";
            }
            else if (zPrecio2==0)
            {
                xprecio2 = "";
                xcant2 = "";
                xsub2 = "";
            }
            else
            {
                xprecio2 = T_Precio2;
                xcant2 = txtCan2.Text;
                xsub2 = txtSubTotal_2.Text;
            }
            cellPre_2 = new PDFT.PdfPCell(new TEXTO.Phrase(xprecio2, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellPre_2.HorizontalAlignment = 2;
            cellPre_2.Border = 0;
            cellPre_2.UseAscender = false;
            datatable.AddCell(cellPre_2);

            cellCant_2= new PDFT.PdfPCell(new TEXTO.Phrase(xcant2, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_2.HorizontalAlignment =1;
            cellCant_2.Border = 0;
            cellCant_2.UseAscender = false;
            datatable.AddCell(cellCant_2);

            cellSub_2= new PDFT.PdfPCell(new TEXTO.Phrase(xsub2, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellSub_2.HorizontalAlignment = 2;
            cellSub_2.Border = 0;
            cellSub_2.UseAscender = false;
            datatable.AddCell(cellSub_2);

            //


            string xprecio3 = string.Empty;
            string xcant3= string.Empty;
            string xsub3= string.Empty;
            if (cmdActividades_2.Text == "-")
            {
                xprecio3 = "";
                xcant3= "";
                xsub3 = "";
            }
            else if (zPrecio3==0)
            {
                xprecio3 = "";
                xcant3 = "";
                xsub3 = "";
            }
            else
            {
                xprecio3 = T_Precio3;
                xcant3= txtCan3.Text;
                xsub3= txtSubTotal_3.Text;
            }

            cellTex_3 = new PDFT.PdfPCell(new TEXTO.Phrase(" Actividad 02 : ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_3.HorizontalAlignment = 0;
            cellTex_3.BackgroundColor =xColor_1;
            cellTex_3.Border = 0;
            cellTex_3.UseAscender = false;
            datatable.AddCell(cellTex_3);

            cellDes_3 = new PDFT.PdfPCell(new TEXTO.Phrase(cmdActividades_2.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellDes_3.HorizontalAlignment = 0;
            cellDes_3.Border = 0;
            cellDes_3.UseAscender = false;
            datatable.AddCell(cellDes_3);

            cellPre_3= new PDFT.PdfPCell(new TEXTO.Phrase(xprecio3, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellPre_3.HorizontalAlignment = 2;
            cellPre_3.Border = 0;
            cellPre_3.UseAscender = false;
            datatable.AddCell(cellPre_3);

            cellCant_3 = new PDFT.PdfPCell(new TEXTO.Phrase(xcant3, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_3.HorizontalAlignment =1;
            cellCant_3.Border = 0;
            cellCant_3.UseAscender = false;
            datatable.AddCell(cellCant_3);

            cellSub_3= new PDFT.PdfPCell(new TEXTO.Phrase(xsub3, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellSub_3.HorizontalAlignment = 2;
            cellSub_3.Border = 0;
            cellSub_3.UseAscender = false;
            datatable.AddCell(cellSub_3);
            //

            string xprecio4 = string.Empty;
            string xcant4= string.Empty;
            string xsub4= string.Empty;

            if (cmdActividades_3.Text == "-")
            {
                xprecio4 = "";
                xcant4= "";
                xsub4= "";
            }
            else if (zPrecio4==0)
            {
                xprecio4 = "";
                xcant4 = "";
                xsub4 = "";
            }
            else
            {
                xprecio4 = T_Precio4;
                xcant4= txtCan4.Text;
                xsub4= txtSubTotal_4.Text;
            }

            cellTex_4 = new PDFT.PdfPCell(new TEXTO.Phrase(" Actividad 03 : ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_4.HorizontalAlignment = 0;
            cellTex_4.BackgroundColor=xColor_1;
            cellTex_4.Border = 0;
            cellTex_4.UseAscender = false;
            datatable.AddCell(cellTex_4);

            cellDes_4 = new PDFT.PdfPCell(new TEXTO.Phrase(cmdActividades_3.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellDes_4.HorizontalAlignment = 0;
            cellDes_4.Border = 0;
            cellDes_4.UseAscender = false;
            datatable.AddCell(cellDes_4);

            cellPre_4= new PDFT.PdfPCell(new TEXTO.Phrase(xprecio4, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellPre_4.HorizontalAlignment = 2;
            cellPre_4.Border = 0;
            cellPre_4.UseAscender = false;
            datatable.AddCell(cellPre_4);

            cellCant_4= new PDFT.PdfPCell(new TEXTO.Phrase(xcant4, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_4.HorizontalAlignment =1;
            cellCant_4.Border = 0;
            cellCant_4.UseAscender = false;
            datatable.AddCell(cellCant_4);

            cellSub_4= new PDFT.PdfPCell(new TEXTO.Phrase(xsub4, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellSub_4.HorizontalAlignment = 2;
            cellSub_4.Border = 0;
            cellSub_4.UseAscender = false;
            datatable.AddCell(cellSub_4);
            //

            string xprecio5= string.Empty;
            string xcant5= string.Empty;
            string xsub5= string.Empty;

            if (cmdTraslados.Text == "-")
            {
                xprecio5 = "";
                xcant5 = "";
                xsub5 = "";
            }
            else if (zPrecio5 == 0)
            {
                xprecio5 = "";
                xcant5 = "";
                xsub5 = "";
            }
            else
            {
                xprecio5 = T_Precio5;
                xcant5 = txtCan5.Text;
                xsub5 = txtSubTotal_5.Text;
            }

            cellTex_5 = new PDFT.PdfPCell(new TEXTO.Phrase(" Traslados : ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_5.HorizontalAlignment = 0;
            cellTex_5.BackgroundColor=xColor_1;
            cellTex_5.Border = 0;
            cellTex_5.UseAscender = false;
            datatable.AddCell(cellTex_5);

            cellDes_5= new PDFT.PdfPCell(new TEXTO.Phrase(cmdTraslados.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellDes_5.HorizontalAlignment = 0;
            cellDes_5.Border = 0;
            cellDes_5.UseAscender = false;
            datatable.AddCell(cellDes_5);

            cellPre_5 = new PDFT.PdfPCell(new TEXTO.Phrase(xprecio5, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellPre_5.HorizontalAlignment = 2;
            cellPre_5.Border = 0;
            cellPre_5.UseAscender = false;
            datatable.AddCell(cellPre_5);

            cellCant_5 = new PDFT.PdfPCell(new TEXTO.Phrase(xcant5, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_5.HorizontalAlignment =1;
            cellCant_5.Border = 0;
            cellCant_5.UseAscender = false;
            datatable.AddCell(cellCant_5);

            cellSub_5= new PDFT.PdfPCell(new TEXTO.Phrase(xsub5, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellSub_5.HorizontalAlignment = 2;
            cellSub_5.Border = 0;
            cellSub_5.UseAscender = false;
            datatable.AddCell(cellSub_5);
            //
            cellTex_6= new PDFT.PdfPCell(new TEXTO.Phrase(" Entradas : ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_6.HorizontalAlignment = 0;
            cellTex_6.BackgroundColor=xColor_1;
            cellTex_6.Border = 0;
            cellTex_6.UseAscender = false;
            datatable.AddCell(cellTex_6);

            cellDes_6= new PDFT.PdfPCell(new TEXTO.Phrase(txtEntradas.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellDes_6.HorizontalAlignment = 0;
            cellDes_6.Border = 0;
            cellDes_6.UseAscender = false;
            datatable.AddCell(cellDes_6);

            cellPre_6 = new PDFT.PdfPCell(new TEXTO.Phrase(txtPrecio_6.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellPre_6.HorizontalAlignment = 2;
            cellPre_6.Border = 0;
            cellPre_6.UseAscender = false;
            datatable.AddCell(cellPre_6);

            cellCant_6 = new PDFT.PdfPCell(new TEXTO.Phrase(txtCan6.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_6.HorizontalAlignment = 1;
            cellCant_6.Border = 0;
            cellCant_6.UseAscender = false;
            datatable.AddCell(cellCant_6);

            cellSub_6= new PDFT.PdfPCell(new TEXTO.Phrase(txtSubTotal_6.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellSub_6.HorizontalAlignment = 2;
            cellSub_6.Border = 0;
            cellSub_6.UseAscender = false;
            datatable.AddCell(cellSub_6);

            document.Add(datatable);
        }
        //
        public void GeneraCargos(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(4);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[4] {17,71,10, 24 };
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            datatable.DefaultCell.BorderWidth = 0;
            //datatable.DefaultCell.HorizontalAlignment = 0;

            var xColor_1 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#fac304"));
            var xColor_2 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#faf3e4"));
            var xColor_3 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));

            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            datatable.DefaultCell.BackgroundColor=xColor_3;
            datatable.AddCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri",xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));

            decimal xExtraSol = 0;
            decimal xExtraDol = 0;

            string xExtraSolText = string.Empty;
            string xExtraDolText = string.Empty;

            xExtraSol = (txtExtraSol.Text.Length == 0) ? 0 : decimal.Parse(txtExtraSol.Text);
            xExtraDol = (txtExtraDol.Text.Length == 0) ? 0 : decimal.Parse(txtExtraDol.Text);

            xExtraSolText = xExtraSol.ToString("N2");
            xExtraDolText = xExtraDol.ToString("N2");

            datatable.HeaderRows = 1;

            PDFT.PdfPCell cellTex_1, cellTex_2,cellTex_3,
            cellVacio_1, cellVacio_2,cellVacio_3,
            cellConcepto_1, cellConcepto_2,cellConcepto_3,
            cellImporte_1, cellImporte_2,cellImporte_3= null;

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" Impuestos (I.G.V.): ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_1.HorizontalAlignment =0;
            cellTex_1.BackgroundColor=xColor_1;
            cellTex_1.Border = 0;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellConcepto_1 = new PDFT.PdfPCell(new TEXTO.Phrase(cmdIgv.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellConcepto_1.HorizontalAlignment = 0;
            cellConcepto_1.Border = 0;
            cellConcepto_1.UseAscender = false;
            datatable.AddCell(cellConcepto_1);

            cellVacio_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_1.HorizontalAlignment =1;
            cellVacio_1.BackgroundColor = xColor_3;
            cellVacio_1.Border = 0;
            cellVacio_1.UseAscender = false;
            datatable.AddCell(cellVacio_1);

            cellImporte_1 = new PDFT.PdfPCell(new TEXTO.Phrase(txtIGV.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellImporte_1.HorizontalAlignment =2;
            cellImporte_1.Border = 0;
            cellImporte_1.UseAscender = false;
            datatable.AddCell(cellImporte_1);
            //
            cellTex_2= new PDFT.PdfPCell(new TEXTO.Phrase(" Cargos:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_2.HorizontalAlignment = 0;
            cellTex_2.BackgroundColor = xColor_1;
            cellTex_2.Border = 0;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            cellConcepto_2= new PDFT.PdfPCell(new TEXTO.Phrase(cmdCargos.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellConcepto_2.HorizontalAlignment = 0;
            cellConcepto_2.Border = 0;
            cellConcepto_2.UseAscender = false;
            datatable.AddCell(cellConcepto_2);

            cellVacio_2= new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_2.HorizontalAlignment =1;
            cellVacio_2.BackgroundColor = xColor_3;
            cellVacio_2.Border = 0;
            cellVacio_2.UseAscender = false;
            datatable.AddCell(cellVacio_2);

            cellImporte_2= new PDFT.PdfPCell(new TEXTO.Phrase(txtCargos.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellImporte_2.HorizontalAlignment =2;
            cellImporte_2.Border = 0;
            cellImporte_2.UseAscender = false;
            datatable.AddCell(cellImporte_2);
            //

            cellTex_3 = new PDFT.PdfPCell(new TEXTO.Phrase(" Cobros Extras:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_3.HorizontalAlignment = 0;
            cellTex_3.BackgroundColor = xColor_1;
            cellTex_3.Border = 0;
            cellTex_3.UseAscender = false;
            datatable.AddCell(cellTex_3);

            cellConcepto_3 = new PDFT.PdfPCell(new TEXTO.Phrase("En Soles ( S/ ) ->  "+xExtraSolText, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellConcepto_3.HorizontalAlignment =0;
            cellConcepto_3.BackgroundColor = xColor_2;
            cellConcepto_3.Border = 0;
            cellConcepto_3.UseAscender = false;
            datatable.AddCell(cellConcepto_3);

            cellVacio_3= new PDFT.PdfPCell(new TEXTO.Phrase("|", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_3.HorizontalAlignment =1;
            cellVacio_3.BackgroundColor = xColor_2;
            cellVacio_3.Border = 0;
            cellVacio_3.UseAscender = false;
            datatable.AddCell(cellVacio_3);

            cellImporte_3 = new PDFT.PdfPCell(new TEXTO.Phrase("En Dólares ( US$ ) →  " + xExtraDolText, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellImporte_3.HorizontalAlignment =2;
            cellImporte_3.BackgroundColor = xColor_2;
            cellImporte_3.Border = 0;
            cellImporte_3.UseAscender = false;
            datatable.AddCell(cellImporte_3);

            document.Add(datatable);
        }
        //
        public void GeneraSeparador(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(1);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[1] {150};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            datatable.DefaultCell.BorderWidth = 0;
            var xColor_3 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            datatable.DefaultCell.BackgroundColor = xColor_3;
            datatable.AddCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.HeaderRows = 1;
            PDFT.PdfPCell cellTex_1= null;

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_1.HorizontalAlignment = 0;
            //cellTex_1.BackgroundColor = xColor_1;
            cellTex_1.Border = 0;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);
            document.Add(datatable);
        }
        //
        public void GeneraTotal(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(6);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[6] { 20,7,20,30, 20,25};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            datatable.DefaultCell.BorderWidth = 0;
            //datatable.DefaultCell.HorizontalAlignment = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            //datatable.DefaultCell.BackgroundCoor = (TEXTO.BaseColor.YELLOW);
            datatable.AddCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));

            datatable.HeaderRows = 1;

            PDFT.PdfPCell cellTex_1, cellTex_2, cellTex_3, cellTex_4, cellTex_5,
            cellTex_6, cellTex_7, cellTex_8, cellTex_9, cellTex_10,
            cell_Vacio_1, cell_Vacio_2, cell_Vacio_3, cell_Vacio_4, cell_Vacio_5,
            cell_Pagar, cell_Acuenta, cell_Saldo, cell_Extra_Sol, cell_Extra_Dol,
            cell_Fecha_Adelanto, cell_MedioPago, cellDocumento, cell_Numero, cell_Ultimo,
            cellMon_1,cellMon_2,cellMon_3,cellMon_4,cellMon_5= null;

            var xColor_1 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#fac304"));
            var xColor_2 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));
            var xColor_3 = new TEXTO.BaseColor(ColorTranslator.FromHtml("#faf3e4"));

            var xColor_Celeste= new TEXTO.BaseColor(ColorTranslator.FromHtml("#2b6ba1"));
            var xColor_Celeste_Bajo= new TEXTO.BaseColor(ColorTranslator.FromHtml("#dcecf3"));
            var xColor_Blanco= new TEXTO.BaseColor(ColorTranslator.FromHtml("#ffffff"));

            decimal xAcuenta = 0;
            decimal xExtraSol= 0;
            decimal xExtraDol= 0;

            string xMoneda = string.Empty;
            xMoneda = (cmdmoneda.Text=="SOLES") ? "S/" : "US$";

            string xAcuentaText = string.Empty;
            string xExtraSolText = string.Empty;
            string xExtraDolText = string.Empty;

            xAcuenta = (txtAcuenta.Text.Length == 0) ? 0 : decimal.Parse(txtAcuenta.Text);
            xExtraSol = (txtExtraSol.Text.Length == 0) ? 0 : decimal.Parse(txtExtraSol.Text);
            xExtraDol = (txtExtraDol.Text.Length == 0) ? 0 : decimal.Parse(txtExtraDol.Text);

            xAcuentaText = xAcuenta.ToString("N2");
            xExtraSolText = xExtraSol.ToString("N2");
            xExtraDolText = xExtraDol.ToString("N2");

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" TOTAL A PAGAR:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_1.HorizontalAlignment = 0;
            cellTex_1.BackgroundColor =xColor_1;
            cellTex_1.Border = 0;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellMon_1= new PDFT.PdfPCell(new TEXTO.Phrase(xMoneda, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellMon_1.HorizontalAlignment =1;
            cellMon_1.BackgroundColor = xColor_2;
            cellMon_1.Border = 0;
            cellMon_1.UseAscender = false;
            datatable.AddCell(cellMon_1);

            cell_Pagar = new PDFT.PdfPCell(new TEXTO.Phrase(txtTotalPagar.Text,TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_Pagar.HorizontalAlignment =2;
            cell_Pagar.BackgroundColor = xColor_2;
            cell_Pagar.Border = 0;
            cell_Pagar.UseAscender = false;
            datatable.AddCell(cell_Pagar);

            cell_Vacio_1= new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cell_Vacio_1.HorizontalAlignment = 1;
            cell_Vacio_1.Border = 0;
            cell_Vacio_1.UseAscender = false;
            datatable.AddCell(cell_Vacio_1);

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase(" Fecha Adelanto:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_2.HorizontalAlignment = 0;
            cellTex_2.BackgroundColor=xColor_Celeste;
            cellTex_2.Border = 0;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            cell_Fecha_Adelanto = new PDFT.PdfPCell(new TEXTO.Phrase(dtimeFechaAdelanto.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_Fecha_Adelanto.HorizontalAlignment = 0;
            cell_Fecha_Adelanto.BackgroundColor =xColor_Celeste_Bajo;
            cell_Fecha_Adelanto.Border = 0;
            cell_Fecha_Adelanto.BorderColor =xColor_Blanco;
            cell_Fecha_Adelanto.UseAscender = false;
            datatable.AddCell(cell_Fecha_Adelanto);
            //
            cellTex_3 = new PDFT.PdfPCell(new TEXTO.Phrase(" A CUENTA", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.Font.BOLD)));
            cellTex_3.HorizontalAlignment = 0;
            cellTex_3.BackgroundColor = xColor_1;
            cellTex_3.Border = 0;
            cellTex_3.UseAscender = false;
            datatable.AddCell(cellTex_3);

            cellMon_2 = new PDFT.PdfPCell(new TEXTO.Phrase(xMoneda, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellMon_2.HorizontalAlignment = 1;
            cellMon_2.BackgroundColor = xColor_2;
            cellMon_2.Border = 0;
            cellMon_2.UseAscender = false;
            datatable.AddCell(cellMon_2);

            cell_Acuenta = new PDFT.PdfPCell(new TEXTO.Phrase(xAcuentaText, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_Acuenta.HorizontalAlignment = 2;
            cell_Acuenta.BackgroundColor = xColor_2;
            cell_Acuenta.Border = 0;
            cell_Acuenta.UseAscender = false;
            datatable.AddCell(cell_Acuenta);

            cell_Vacio_2 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cell_Vacio_2.HorizontalAlignment = 1;
            cell_Vacio_2.Border = 0;
            cell_Vacio_2.UseAscender = false;
            datatable.AddCell(cell_Vacio_2);

            cellTex_4 = new PDFT.PdfPCell(new TEXTO.Phrase(" Medio de Pago:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_4.HorizontalAlignment = 0;
            cellTex_4.BackgroundColor=xColor_Celeste;
            cellTex_4.Border = 0;
            cellTex_4.UseAscender = false;
            datatable.AddCell(cellTex_4);
            //
            cell_MedioPago= new PDFT.PdfPCell(new TEXTO.Phrase(cmdMedioPago.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_MedioPago.HorizontalAlignment = 0;
            cell_MedioPago.BackgroundColor=xColor_Celeste_Bajo;
            //cell_MedioPago.Border = 0;
            cell_MedioPago.BorderColor = xColor_Blanco;
            cell_MedioPago.UseAscender = false;
            datatable.AddCell(cell_MedioPago);

            //

            cellTex_5= new PDFT.PdfPCell(new TEXTO.Phrase(" SALDO:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.Font.BOLD)));
            cellTex_5.HorizontalAlignment = 0;
            cellTex_5.BackgroundColor = xColor_1;
            cellTex_5.Border = 0;
            cellTex_5.UseAscender = false;
            datatable.AddCell(cellTex_5);

            cellMon_3= new PDFT.PdfPCell(new TEXTO.Phrase(xMoneda, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellMon_3.HorizontalAlignment = 1;
            cellMon_3.BackgroundColor = xColor_2;
            cellMon_3.Border = 0;
            cellMon_3.UseAscender = false;
            datatable.AddCell(cellMon_3);

            cell_Saldo = new PDFT.PdfPCell(new TEXTO.Phrase(txtSaldo.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cell_Saldo.HorizontalAlignment = 2;
            cell_Saldo.BackgroundColor = xColor_2;
            cell_Saldo.Border = 0;
            cell_Saldo.UseAscender = false;
            datatable.AddCell(cell_Saldo);

            cell_Vacio_3 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cell_Vacio_3.HorizontalAlignment = 1;
            cell_Vacio_3.Border = 0;
            cell_Vacio_3.UseAscender = false;
            datatable.AddCell(cell_Vacio_3);

            cellTex_6= new PDFT.PdfPCell(new TEXTO.Phrase(" Documento de Vta:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_6.HorizontalAlignment = 0;
            cellTex_6.BackgroundColor=xColor_Celeste;
            cellTex_6.Border = 0;
            cellTex_6.UseAscender = false;
            datatable.AddCell(cellTex_6);

            cellDocumento= new PDFT.PdfPCell(new TEXTO.Phrase(cmdDocumento.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellDocumento.HorizontalAlignment = 0;
            cellDocumento.BackgroundColor=xColor_Celeste_Bajo;
            //cellDocumento.Border = 0;
            cellDocumento.BorderColor = xColor_Blanco;
            cellDocumento.UseAscender = false;
            datatable.AddCell(cellDocumento);
            //

            cellTex_7 = new PDFT.PdfPCell(new TEXTO.Phrase(" Cobro Extra Soles:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_7.HorizontalAlignment = 0;
            cellTex_7.BackgroundColor=xColor_3;
            cellTex_7.Border = 0;
            cellTex_7.UseAscender = false;
            datatable.AddCell(cellTex_7);


            cellMon_4 = new PDFT.PdfPCell(new TEXTO.Phrase("S/", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellMon_4.HorizontalAlignment = 1;
            cellMon_4.BackgroundColor = xColor_2;
            cellMon_4.Border = 0;
            cellMon_4.UseAscender = false;
            datatable.AddCell(cellMon_4);

            cell_Extra_Sol = new PDFT.PdfPCell(new TEXTO.Phrase(xExtraSolText, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_Extra_Sol.HorizontalAlignment = 2;
            cell_Extra_Sol.BackgroundColor=xColor_2;
            cell_Extra_Sol.Border = 0;
            cell_Extra_Sol.UseAscender = false;
            datatable.AddCell(cell_Extra_Sol);

            cell_Vacio_4 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cell_Vacio_4.HorizontalAlignment = 1;
            cell_Vacio_4.Border = 0;
            cell_Vacio_4.UseAscender = false;
            datatable.AddCell(cell_Vacio_4);

            cellTex_8 = new PDFT.PdfPCell(new TEXTO.Phrase(" Nº Documento:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,xColor_Blanco)));
            cellTex_8.HorizontalAlignment = 0;
            cellTex_8.BackgroundColor=xColor_Celeste;
            cellTex_8.Border = 0;
            cellTex_8.UseAscender = false;
            datatable.AddCell(cellTex_8);

            cell_Numero= new PDFT.PdfPCell(new TEXTO.Phrase(txtSerie.Text+"-"+txtnroDoc.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_Numero.HorizontalAlignment = 0;
            cell_Numero.BackgroundColor=xColor_Celeste_Bajo;
            //cell_Numero.Border = 0;
            cell_Numero.BorderColor = xColor_Blanco;
            cell_Numero.UseAscender = false;
            datatable.AddCell(cell_Numero);

            //

            cellTex_9= new PDFT.PdfPCell(new TEXTO.Phrase(" Cobro Extra Dólares:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_9.HorizontalAlignment = 0;
            cellTex_9.BackgroundColor =xColor_3;
            cellTex_9.Border = 0;
            cellTex_9.UseAscender = false;
            datatable.AddCell(cellTex_9);

            cellMon_5= new PDFT.PdfPCell(new TEXTO.Phrase("US$", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellMon_5.HorizontalAlignment = 1;
            cellMon_5.BackgroundColor = xColor_2;
            cellMon_5.Border = 0;
            cellMon_5.UseAscender = false;
            datatable.AddCell(cellMon_5);

            cell_Extra_Dol = new PDFT.PdfPCell(new TEXTO.Phrase(xExtraDolText, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_Extra_Dol.HorizontalAlignment = 2;
            cell_Extra_Dol.BackgroundColor=xColor_2;
            cell_Extra_Dol.Border = 0;
            cell_Extra_Dol.UseAscender = false;
            datatable.AddCell(cell_Extra_Dol);

            cell_Vacio_5 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cell_Vacio_5.HorizontalAlignment = 1;
            cell_Vacio_5.Border = 0;
            cell_Vacio_5.UseAscender = false;
            datatable.AddCell(cell_Vacio_5);

            cellTex_10 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_10.HorizontalAlignment = 0;
            cellTex_10.Border = 0;
            cellTex_10.UseAscender = false;
            datatable.AddCell(cellTex_10);

            cell_Ultimo= new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cell_Ultimo.HorizontalAlignment = 0;
            cell_Ultimo.Border = 0;
            cell_Ultimo.UseAscender = false;
            datatable.AddCell(cell_Ultimo);

            document.Add(datatable);
        }
        //
        public void GeneraOBS(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(3);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[3] {53,34,50};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            datatable.DefaultCell.BorderWidth = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));

            datatable.HeaderRows = 1;

            PDFT.PdfPCell cellTex_1, cellTex_2,cellTex_4,
                cellTex_3,Cell_Mensaje,cell_OBS = null;
            decimal xSaldo = 0;
            xSaldo = (txtSaldo.Text.Length == 0) ? 0 : decimal.Parse(txtSaldo.Text);

            var xColor_Azul= new TEXTO.BaseColor(48, 84, 150);
            var xColor_Rojo= new TEXTO.BaseColor(ColorTranslator.FromHtml("#9b111e"));
            var xColor_gris= new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));
            var xColor_Blanco = new TEXTO.BaseColor(ColorTranslator.FromHtml("#ffffff"));

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_1.HorizontalAlignment = 1;
            cellTex_1.Border= 0;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_2.HorizontalAlignment = 0;
            cellTex_2.Border = 0;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            cellTex_3 = new PDFT.PdfPCell(new TEXTO.Phrase("OBSERVACIONES", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellTex_3.HorizontalAlignment = 0;
            cellTex_3.Border= 0;
            cellTex_3.UseAscender = false;
            datatable.AddCell(cellTex_3);

            if (xSaldo > 0)
            {
                Cell_Mensaje = new PDFT.PdfPCell(new TEXTO.Phrase(" \n" + lblMensaje.Text + "\n ", TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD, xColor_Blanco)));
                Cell_Mensaje.HorizontalAlignment = 1;
                Cell_Mensaje.Border = 0;
                Cell_Mensaje.BackgroundColor = xColor_Rojo;
                Cell_Mensaje.UseAscender = false;
                datatable.AddCell(Cell_Mensaje);
            }
            else
            {
                Cell_Mensaje = new PDFT.PdfPCell(new TEXTO.Phrase(" \n" + lblMensaje.Text + "\n ", TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD, xColor_Blanco)));
                Cell_Mensaje.HorizontalAlignment = 1;
                Cell_Mensaje.Border = 0;
                Cell_Mensaje.BackgroundColor = xColor_Azul;
                Cell_Mensaje.UseAscender = false;
                datatable.AddCell(Cell_Mensaje);
            }

            cellTex_4 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_4.HorizontalAlignment = 0;
            cellTex_4.Border= 0;
            cellTex_4.UseAscender = false;
            datatable.AddCell(cellTex_4);

            cell_OBS = new PDFT.PdfPCell(new TEXTO.Phrase(txtObservaciones.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_OBS.HorizontalAlignment =0;
            cell_OBS.BackgroundColor=xColor_gris;
            cell_OBS.Border=0;
            cell_OBS.UseAscender = false;
            datatable.AddCell(cell_OBS);
            //
            document.Add(datatable);
        }
        public void abrirPDF()
        {
            try
            {
                string xruta = string.Empty;
                string xarchivo = string.Empty;
                DateTime dfecha = Convert.ToDateTime(dtimeFechaViaje.Value.ToString("dd/MM/yyyy"));
                string xfecha = dfecha.ToString("dd-MM-yyyy");
                xarchivo = String.Format("{0}_{1}_{2}_{3}.PDF", xfecha, "FullDay", "ID", lblIdNota.Text);
                xruta = "\\\\" + xconexion.xPC_Personal+ "\\ArchivoSistema\\FullDay\\" + xarchivo;
                FileInfo di = new FileInfo(xruta);
                if (di.Exists) Process.Start(xruta);
                else men.ErrorArchivo();
            }
            catch (Exception ex)
            {
                MessageBox.Show("ERROR" + ex.ToString(), "ERROR", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        private void btnpdf_Click(object sender, EventArgs e)
        {
            exportarPDF();
        }
        //DOCUMENTO DE COBRANZA

        #region EXPORTARPDF
        public void eliminarArchivosD()
        {
            xErrorArchivo = 0;
            string temPDF = string.Empty;
            string xarchivo = string.Empty;
            DateTime dfecha = Convert.ToDateTime(dtimeFechaViaje.Value.ToString("dd/MM/yyyy"));
            string xfecha = dfecha.ToString("dd-MM-yyyy");
            xarchivo = String.Format("{0}_{1}_{2}_{3}.PDF", xfecha, "DV", "ID", lblIdNota.Text);
            temPDF = "\\\\" + xconexion.xPC_Personal + "\\ArchivoSistema\\FullDay\\Documentos\\" + xarchivo;
            try
            {
                File.Delete(temPDF);
            }
            catch (Exception ex)
            {
                ex.ToString();
                xErrorArchivo = 1;
            }
        }
        public void exportarDocumento()
        {
            eliminarArchivosD();
            if (xErrorArchivo == 0)
            {
                TEXTO.Document doc = new TEXTO.Document(TEXTO.PageSize.A4, 10, 10, 10, 10);
                string filename, xarchivo = string.Empty;
                DateTime dfecha = Convert.ToDateTime(dtimeFechaViaje.Value.ToString("dd/MM/yyyy"));
                string xfecha = dfecha.ToString("dd-MM-yyyy");
                xarchivo = String.Format("{0}_{1}_{2}_{3}.PDF", xfecha, "DV", "ID", lblIdNota.Text);
                filename = "\\\\" + xconexion.xPC_Personal + "\\ArchivoSistema\\FullDay\\Documentos\\" + xarchivo;
                if (filename.Trim() != "")
                {
                    FileStream file = new FileStream(filename,
                FileMode.OpenOrCreate,
                FileAccess.ReadWrite,
                FileShare.ReadWrite);
                PDFT.PdfWriter writer = PDFT.PdfWriter.GetInstance(doc, file);
                doc.Open();
                string xruta = string.Empty;
                string xrutaB = string.Empty;
                xruta = "\\\\" + xconexion.xPC_Personal + "\\mp3\\Docu_Cobranza.png";
                xrutaB = "\\\\" + xconexion.xPC_Personal + "\\mp3\\LogoPicaFlor2.jpg";
                TEXTO.Image imagen = TEXTO.Image.GetInstance(xruta);
                imagen.BorderWidth = 0;
                imagen.SetAbsolutePosition(404f, 760f);
                imagen.ScalePercent(20);
                doc.Add(imagen);

                TEXTO.Image imagenB = TEXTO.Image.GetInstance(xrutaB);
                imagenB.BorderWidth = 0;
                imagenB.SetAbsolutePosition(105f, 792f);
                imagenB.ScalePercent(35);
                doc.Add(imagenB);

                doc.Add(new TEXTO.Paragraph("\n\n\n\n                                  Av.Jose Pardo N° 620 Interior MZ-26-Miraflores (Lima-Peru)                                    " +
                "                            " + txtSerie.Text + "-" + txtnroDoc.Text + "\n       " +
                "                                              Telf:(+51 1) 2415374 / 4441283 \n                                      " +
                "     Cel.:987420868 / #974930875 / (rpc) 984740005 \n " +
                "                                                  E-mail: info@viajespicaflorperu.net", TEXTO.FontFactory.GetFont("Calibri", 8)));
                doc.Add(new TEXTO.Paragraph("                       ", TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD)));
                GeneraCabDocu1(doc);
                GeneraCabDocu2(doc);
                doc.Add(new TEXTO.Paragraph("                       "));
                GeneraDetalle2(doc);
                GeneraSubTotal(doc);
                doc.Close();
                //Process.Start(filename);
                }
            }
            else
            {
                MessageBox.Show("Cierre el archivo antes de Generar el nuevo Reporte", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }
        public void GeneraCabDocu1(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(2);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[2] { 12,100};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            datatable.DefaultCell.BorderWidth = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));

            datatable.HeaderRows = 1;

            PDFT.PdfPCell cellTex_1,cellTex_2,
            cellCliente, cellDirecion= null;

            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase("Señor(es): ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_1.HorizontalAlignment = 0;
            cellTex_1.Border = 0;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellCliente= new PDFT.PdfPCell(new TEXTO.Phrase(txtcliente.Text.Trim(), TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCliente.HorizontalAlignment = 0;
            cellCliente.Border = 0;
            cellCliente.UseAscender = false;
            datatable.AddCell(cellCliente);

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase("Direccion: ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_2.HorizontalAlignment = 0;
            cellTex_2.Border = 0;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            cellDirecion= new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellDirecion.HorizontalAlignment = 0;
            cellDirecion.Border = 0;
            cellDirecion.UseAscender = false;
            datatable.AddCell(cellDirecion);

            document.Add(datatable);
        }
        public void GeneraCabDocu2(TEXTO.Document document)
        {
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(4);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[4] {14,80,20,17};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage =96;
            datatable.DefaultCell.BorderWidth = 0;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));

            datatable.HeaderRows = 1;

            PDFT.PdfPCell cellTex_1, cellTex_2,cellTex_3,cellTex_4,
            cellTelefono,cellCounter,Cell_Liquida,cell_FechaEmision= null;
            

            var xColor_gris = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));


            cellTex_1 = new PDFT.PdfPCell(new TEXTO.Phrase("Telefonos:", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_1.HorizontalAlignment =0;
            cellTex_1.Border = 0;
            cellTex_1.UseAscender = false;
            datatable.AddCell(cellTex_1);

            cellTelefono = new PDFT.PdfPCell(new TEXTO.Phrase(txtcelular.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTelefono.HorizontalAlignment = 0;
            cellTelefono.Border = 0;
            cellTelefono.UseAscender = false;
            datatable.AddCell(cellTelefono);

            cellTex_2 = new PDFT.PdfPCell(new TEXTO.Phrase("Liquidacion N° ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_2.HorizontalAlignment = 0;
            //cellTex_2.Border = 0;
            cellTex_2.BackgroundColor =xColor_gris;
            cellTex_2.UseAscender = false;
            datatable.AddCell(cellTex_2);

            Cell_Liquida = new PDFT.PdfPCell(new TEXTO.Phrase(" "+lblIdNota.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            Cell_Liquida.HorizontalAlignment = 0;
            //Cell_Liquida.Border = 0;
            Cell_Liquida.UseAscender = false;
            datatable.AddCell(Cell_Liquida);

            cellTex_3= new PDFT.PdfPCell(new TEXTO.Phrase("Counter: ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_3.HorizontalAlignment = 0;
            cellTex_3.Border = 0;
            cellTex_3.UseAscender = false;
            datatable.AddCell(cellTex_3);

            cellCounter= new PDFT.PdfPCell(new TEXTO.Phrase(txtusuario.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCounter.HorizontalAlignment = 0;
            cellCounter.Border = 0;
            cellCounter.UseAscender = false;
            datatable.AddCell(cellCounter);

            cellTex_4= new PDFT.PdfPCell(new TEXTO.Phrase("Fecha de Emision: ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellTex_4.HorizontalAlignment = 0;
            cellTex_4.BackgroundColor = xColor_gris;
            //cellTex_4.Border = 0;
            cellTex_4.UseAscender = false;
            datatable.AddCell(cellTex_4);

            cell_FechaEmision= new PDFT.PdfPCell(new TEXTO.Phrase(" "+dtimeFechaViaje.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cell_FechaEmision.HorizontalAlignment = 0;
            //Cell_Liquida.Border = 0;
            cell_FechaEmision.UseAscender = false;
            datatable.AddCell(cell_FechaEmision);

            document.Add(datatable);
        }
        //
        public void GeneraDetalle2(TEXTO.Document document)
        {

            var xColor_gris = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(3);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[3] {16,110,30};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            //datatable.DefaultCell.BorderWidth = 0;
            datatable.DefaultCell.BackgroundColor =xColor_gris;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            datatable.AddCell(new TEXTO.Phrase("Cantidad", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("Descripcion", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("Importe", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));

            datatable.HeaderRows = 1;

            PDFT.PdfPCell cellCant_1, cellDes_2, cellImp_3 = null;

            cellCant_1 = new PDFT.PdfPCell(new TEXTO.Phrase("\n\n"+txtCantPasajeros.Text+ "\n\n\n\n\n\n\n\n", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellCant_1.HorizontalAlignment =1;
            //cellCant_1.Border = 0;
            cellCant_1.UseAscender = false;
            datatable.AddCell(cellCant_1);

            cellDes_2= new PDFT.PdfPCell(new TEXTO.Phrase("\n\n" +cmdServicios.Text + "\n\n\n\n\n\n\n\n", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellDes_2.HorizontalAlignment = 0;
            //cellDes_2.Border = 0;
            cellDes_2.UseAscender = false;
            datatable.AddCell(cellDes_2);

            cellImp_3 = new PDFT.PdfPCell(new TEXTO.Phrase("\n\n"+txtTotalPagar.Text + "\n\n\n\n\n\n\n\n", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellImp_3.HorizontalAlignment =1;
            //cellTex_2.Border = 0;
            //cellImp_3.BackgroundColor = xColor_gris;
            cellImp_3.UseAscender = false;
            datatable.AddCell(cellImp_3);

            document.Add(datatable);
        }
        //
        public void GeneraSubTotal(TEXTO.Document document)
        {

            var xColor_gris = new TEXTO.BaseColor(ColorTranslator.FromHtml("#e8e7e3"));
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(4);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[4] { 30, 44, 14, 21 };
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 96;
            datatable.DefaultCell.BorderWidth = 0;
            //datatable.DefaultCell.BackgroundColor = xColor_gris;
            datatable.HorizontalAlignment = TEXTO.Element.ALIGN_LEFT;
            datatable.AddCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            datatable.AddCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));

            datatable.HeaderRows = 1;
            string xmoneda = string.Empty;
            xmoneda = (cmdmoneda.Text == "SOLES") ? "S/" : "$";

            decimal xacuenta = 0;
            xacuenta = (txtAcuenta.Text.Length == 0) ? 0 : decimal.Parse(txtAcuenta.Text);

            string xAcuentaTexto = string.Empty;
            xAcuentaTexto = xacuenta.ToString("N2");

            PDFT.PdfPCell cellText_1, cellVacio_1, cellText_2,
            cellText_3, cellVacio_2, cellText_4,
            cellText_5, cellVacio_3, cellText_6,
            cellText_7, cellVacio_4, cellText_8, cellText_9,
            cell_Total, cell_Acuenta, cell_Saldo;

            cellText_1 = new PDFT.PdfPCell(new TEXTO.Phrase("WWW.VIAJESPICAFLORPERU.NET", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.Font.BOLD)));
            cellText_1.HorizontalAlignment =0;
            cellText_1.Border = 0;
            cellText_1.UseAscender = false;
            datatable.AddCell(cellText_1);

            cellVacio_1 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_1.HorizontalAlignment = 0;
            cellVacio_1.Border = 0;
            cellVacio_1.UseAscender = false;
            datatable.AddCell(cellVacio_1);

            cellText_2 = new PDFT.PdfPCell(new TEXTO.Phrase("TOTAL:  "+xmoneda, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellText_2.HorizontalAlignment = 2;
            //cellTex_2.Border = 0;
            cellText_2.BackgroundColor = xColor_gris;
            cellText_2.UseAscender = false;
            datatable.AddCell(cellText_2);

            cell_Total = new PDFT.PdfPCell(new TEXTO.Phrase(txtTotalPagar.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_Total.HorizontalAlignment =2;
            //cellCant_1.Border = 0;
            cell_Total.UseAscender = false;
            datatable.AddCell(cell_Total);
            //
            cellText_3 = new PDFT.PdfPCell(new TEXTO.Phrase("Forma de Pago", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.Font.BOLD)));
            cellText_3.HorizontalAlignment = 0;
            cellText_3.Border = 0;
            cellText_3.UseAscender = false;
            datatable.AddCell(cellText_3);

            cellVacio_2 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_2.HorizontalAlignment = 0;
            cellVacio_2.Border = 0;
            cellVacio_2.UseAscender = false;
            datatable.AddCell(cellVacio_2);

            cellText_4 = new PDFT.PdfPCell(new TEXTO.Phrase("A CUENTA:  " + xmoneda, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF,TEXTO.Font.BOLD)));
            cellText_4.HorizontalAlignment = 2;
            cellText_4.Border = 0;
            //cellText_4.BackgroundColor = xColor_gris;
            cellText_4.UseAscender = false;
            datatable.AddCell(cellText_4);

            cell_Acuenta = new PDFT.PdfPCell(new TEXTO.Phrase(xAcuentaTexto, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_Acuenta.HorizontalAlignment =2;
            cell_Acuenta.Border = 0;
            cell_Acuenta.UseAscender = false;
            datatable.AddCell(cell_Acuenta);

            cellText_5 = new PDFT.PdfPCell(new TEXTO.Phrase(".Efectivo   .T/MasterCard   .T/Visa", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellText_5.HorizontalAlignment = 0;
            cellText_5.Border = 0;
            cellText_5.UseAscender = false;
            datatable.AddCell(cellText_5);


            cellVacio_3= new PDFT.PdfPCell(new TEXTO.Phrase("_____________________________", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_3.HorizontalAlignment =1;
            cellVacio_3.Border = 0;
            cellVacio_3.UseAscender = false;
            datatable.AddCell(cellVacio_3);


            cellText_6 = new PDFT.PdfPCell(new TEXTO.Phrase("Saldo:  " + xmoneda, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellText_6.HorizontalAlignment = 2;
            cellText_6.Border = 0;
            //cellText_4.BackgroundColor = xColor_gris;
            cellText_6.UseAscender = false;
            datatable.AddCell(cellText_6);

            cell_Saldo= new PDFT.PdfPCell(new TEXTO.Phrase(txtSaldo.Text, TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cell_Saldo.HorizontalAlignment = 2;
            cell_Saldo.Border = 0;
            cell_Saldo.UseAscender = false;
            datatable.AddCell(cell_Saldo);

            //

            cellText_7= new PDFT.PdfPCell(new TEXTO.Phrase(".Canje       .Banco: .......................", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellText_7.HorizontalAlignment = 0;
            cellText_7.Border = 0;
            cellText_7.UseAscender = false;
            datatable.AddCell(cellText_7);


            cellVacio_4= new PDFT.PdfPCell(new TEXTO.Phrase("AAVV", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellVacio_4.HorizontalAlignment = 1;
            cellVacio_4.Border = 0;
            cellVacio_4.UseAscender = false;
            datatable.AddCell(cellVacio_4);


            cellText_8 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF, TEXTO.Font.BOLD)));
            cellText_8.HorizontalAlignment = 2;
            cellText_8.Border = 0;
            //cellText_4.BackgroundColor = xColor_gris;
            cellText_8.UseAscender = false;
            datatable.AddCell(cellText_8);

            cellText_9 = new PDFT.PdfPCell(new TEXTO.Phrase(" ", TEXTO.FontFactory.GetFont("Calibri", xSizeTextoPDF)));
            cellText_9.HorizontalAlignment = 2;
            cellText_9.Border = 0;
            cellText_9.UseAscender = false;
            datatable.AddCell(cellText_9);


            document.Add(datatable);
        }
        #endregion
        public void abrirPDF_B()
        {
            try
            {
                string xruta = string.Empty;
                string xarchivo = string.Empty;
                DateTime dfecha = Convert.ToDateTime(dtimeFechaViaje.Value.ToString("dd/MM/yyyy"));
                string xfecha = dfecha.ToString("dd-MM-yyyy");
                xarchivo = String.Format("{0}_{1}_{2}_{3}.PDF", xfecha, "DV", "ID", lblIdNota.Text);
                xruta = "\\\\" + xconexion.xPC_Personal + "\\ArchivoSistema\\FullDay\\Documentos\\" + xarchivo;
                FileInfo di = new FileInfo(xruta);
                if (di.Exists) Process.Start(xruta);
                else men.ErrorArchivo();
            }
            catch (Exception ex)
            {
                MessageBox.Show("ERROR" + ex.ToString(), "ERROR", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        private void btnPDF2_Click(object sender, EventArgs e)
        {
            exportarDocumento();
            abrirPDF_B();
        }
        private void btncargar_Click(object sender, EventArgs e)
        {
            MessageBox.Show("ACTUALMENTE EL SERVIDOR PRINCIPAL DE LA OFICINA, HA CAMBIADO DE RED...PERO AUN ASI PUEDE GUARDAR LOS DATOS.",
                   "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
            /*
            if (validaIP() == true)
            {
                if (ximagen3.Image == null || txtruta.Text == ImageNula.ToString())
                {
                    OpenFileDialog dialog = new OpenFileDialog();
                    dialog.Filter = "Archivos de imagen|*.JPG;*.PNG;*.BMP;*.JPEG";
                    DialogResult result = dialog.ShowDialog();
                    if (result == DialogResult.OK)
                    {
                        this.imagecaptura.SizeMode = PictureBoxSizeMode.StretchImage;
                        this.imagecaptura.Image = System.Drawing.Image.FromFile(dialog.FileName);
                        this.ximgenpro.Visible = false;
                        this.ximagen3.Visible = false;
                        this.imagecaptura.Visible = true;
                    }
                    else
                    {
                        imagecaptura.Image = null;
                        this.ximgenpro.Visible = false;
                        this.imagecaptura.Visible = false;
                        this.ximagen3.Visible = true;
                    }
                }
                else
                {
                    MessageBox.Show("Deve limpiar la imagen antes de cargar otra porfavor", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }
            else
            {
                MessageBox.Show("ACTUALMENTE NO SE ENCUENTRA EN LA RED PRINCIPAL DE LA OFICINA...PERO AUN ASI PUEDE GUARDAR LOS DATOS",
                    "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }*/
        }
        private void btnlimpiarimg_Click(object sender, EventArgs e)
        {
            ximagen3.Image = null;
            imagecaptura.Image = null;
            ximgenpro.Image = null;
        }
        private void txtcelular_TextChanged(object sender, EventArgs e)
        {
            txtcelular.CharacterCasing = CharacterCasing.Upper;
        }
        private void txtcelular_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtCantPasajeros.SelectionStart = txtCantPasajeros.Text.Length;
                txtCantPasajeros.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        private void txtcelular_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up)
            {
                txtDni.SelectionStart = txtDni.Text.Length;
                txtDni.Focus();
            }
        }
        private void txtDni_TextChanged(object sender, EventArgs e)
        {
            txtDni.CharacterCasing = CharacterCasing.Upper;
        }
        private void txtDni_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtcelular.SelectionStart = txtcelular.Text.Length;
                txtcelular.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        private void txtDni_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Up)
            {
                txtcliente.SelectionStart = txtcliente.Text.Length;
                txtcliente.Focus();
            }
        }
        private void dtimeProgramacion_ValueChanged(object sender, EventArgs e)
        {
            listarPanelPrin();
        }
        private void dtimeProgramacion_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                gvProgramacion.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        public bool validarCantPax(string xproceduere)
        {
            bool xEscorrcto = false;
            string xvalue = string.Empty;
            xvalue = dtimeFechaViaje.Value.ToString("MM-dd-yyyy") + "|" + cmdServicios.SelectedValue.ToString();
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando(xproceduere, "@Valores", xvalue);
            if (!string.IsNullOrEmpty(rpt))
            {
                string[] xData;
                xData = rpt.Split('¬');
                string xmensaje = string.Empty;
                xCantMax = string.Empty;
                xCanPax = string.Empty;
                xmensaje = xData[0];
                xCanPax = xData[1];
                xCantMax = xData[2];
                xEscorrcto = (xmensaje.Contains("true")) ? true : false;
            }
            return xEscorrcto;
        }
        public bool traerCantPaxfecha(int xmaximo)
        {
            bool xEscorrcto = false;
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarConsulta("Declare @cant int  set @cant=isnull((select sum(n.CantidadPax) from NotaPedido n " +
            "where n.NotaFechaPago = '" + dtimeFechaViaje.Value.ToString("MM-dd-yyyy") + "' " +
            "and n.IdProducto ='" + cmdServicios.SelectedValue.ToString() + "' and n.NotaEstado<>'ANULADO'),0) " +
            "select convert(varchar, @cant)");
            if (!string.IsNullOrEmpty(rpt))
            {
                xEscorrcto = (int.Parse(rpt) >= xmaximo) ? xEscorrcto = false : xEscorrcto = true;
            }
            return xEscorrcto;
        }
        public void generaFullDay()
        {
            lblDisponible.Text = "0";
            xMaximo = 0;
            this.cmdServicios.SelectedValue = Convert.ToString(gvProgramacion.CurrentRow.Cells[0].Value);
            this.dtimeFechaViaje.Text = Convert.ToString(gvProgramacion.CurrentRow.Cells[2].Value);
            xMaximo = Convert.ToInt32(gvProgramacion.CurrentRow.Cells[4].Value);
            this.lblDisponible.Text = Convert.ToString(gvProgramacion.CurrentRow.Cells[5].Value);
            xRegion= Convert.ToString(gvProgramacion.CurrentRow.Cells[7].Value);
            if (traerCantPaxfecha(xMaximo) == true)
            {
                _PanelPrincipal.Visible = false;
                cmdServicios.Enabled = false;
                dtimeFechaViaje.Enabled = false;
                lblTextDis.Visible = true;
                lblDisponible.Visible = true;
                traerVisitas(xlistas[1]);
            }
            else
            {
                lblDisponible.Text = "0";
                lblTextDis.Visible = false;
                lblDisponible.Visible = false;
                MessageBox.Show("YA SUPERO EL LIMITE DE PASAJEROS POR DIA, QUE ES DE (" + xMaximo.ToString() + "), FAVOR DE VERIFICAR OTRA FECHA", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                listarPanelPrin();
                gvProgramacion.Focus();
            }
        }
        public void eliminarPrograma()
        {
            if (xArea.Equals("OPERACIONES") || xArea.Equals("GERENCIA Y ADMINISTRACION"))
            {
                DialogResult resul = new DialogResult();
                resul = MessageBox.Show("Esta Seguro Que Desea Eliminar El Dato Seleccionado?", "ELIMINAR", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
                if (resul == DialogResult.OK)
                {
                    string xDetaId = string.Empty;
                    xDetaId = Convert.ToString(gvProgramacion.CurrentRow.Cells[9].Value);
                    AccesoDatos daSQL = new AccesoDatos("con");
                    string rpt = daSQL.ejecutarConsulta("delete from ProgramacionFD where DetalleId ='" + xDetaId + "' select 'true'");
                    if (!string.IsNullOrEmpty(rpt))
                    {
                        men.EliminoCorrecto();
                        listarPanelPrin();
                    }
                    else
                    {
                        men.EliminoError();
                    }
                }
            }
        }
        private void gvProgramacion_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                if (gvProgramacion.CurrentCell.ColumnIndex == 6)
                {
                    e.SuppressKeyPress = true;
                    generaFullDay();
                }
                else if (gvProgramacion.CurrentCell.ColumnIndex == 8)
                {
                    e.SuppressKeyPress = true;
                    verListado();
                }
            }
            else if (e.KeyCode == Keys.ShiftKey)
            {
                dtimeProgramacion.Focus();
            }
            else if (e.KeyCode == Keys.Delete)
            {
                eliminarPrograma();
            }
        }
        public void contarFilasProgra()
        {
            try
            {
                foreach (DataGridViewRow row in gvProgramacion.Rows)
                {
                    row.HeaderCell.Value = (row.Index + 1).ToString();
                }
            }
            catch (Exception ex) { ex.ToString(); }
        }
        public void pintarCeldasBlo()
        {
            try
            {
                int count;
                int vitems = gvProgramacion.Rows.Count;
                if (vitems >= 1)
                {
                    for (count = 0; count < vitems; count++)
                    {
                        if (Convert.ToString(gvProgramacion.Rows[count].Cells[6].Value) == "BLOQUEADO")
                            gvProgramacion.Rows[count].DefaultCellStyle.BackColor = Color.LightCoral;
                        else
                            gvProgramacion.Rows[count].DefaultCellStyle.BackColor = Color.White;
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }
        public void verListado()
        {
            txtfullday.Text = "";
            txtbusVerListado.Text = "";
            dtimefechaLisPa.Text = DateTime.Now.ToString("dd/MM/yyyy");
            gvVerListado.DataSource = null;
            lblCantVerLis.Text = "0";
            string xIdpro = string.Empty;

            xIdpro = Convert.ToString(gvProgramacion.CurrentRow.Cells[0].Value);
            this.txtfullday.Text = Convert.ToString(gvProgramacion.CurrentRow.Cells[1].Value);
            this.dtimefechaLisPa.Text = Convert.ToString(gvProgramacion.CurrentRow.Cells[2].Value);

            string xvalue = string.Empty;
            xvalue = dtimefechaLisPa.Value.ToString("MM/dd/yyyy") + "|" + dtimefechaLisPa.Value.ToString("MM/dd/yyyy") + "|" + xIdpro;
            AccesoDatos daSQL = new AccesoDatos("con");
            String rpt = daSQL.ejecutarComando("usplistaPanelFullday", "@Valores", xvalue);
            if (rpt != "")
            {
                TablaV = Cadena.CrearTabla(rpt);
                vistaV = TablaV.DefaultView;
                bsV = new BindingSource();
                bsV.DataSource = TablaV;
                gvVerListado.DataSource = bsV;
                this.tabControl2.SelectedIndex = 1;
                gvVerListado.Columns[2].Visible = false;

                if (txtfullday.Text == "FULL DAY PARACAS - ICA")
                {
                    TablaV.Columns[7].ColumnName = "Islas";
                    TablaV.Columns[8].ColumnName = "Tubu";
                    TablaV.Columns[9].ColumnName = "Rese.N";
                }
                else if (txtfullday.Text == "FULL DAY LUNAHUANA")
                {
                    TablaV.Columns[7].ColumnName = "Cuatri";
                    TablaV.Columns[8].ColumnName = "Canopy";
                    TablaV.Columns[9].ColumnName = "Canota";
                }
                else if (txtfullday.Text == "FULL DAY AUCALLAMA - CHANCAY")
                {
                    TablaV.Columns[7].ColumnName = "Cast.Cha";
                    TablaV.Columns[8].ColumnName = "Haci.Hu";
                    TablaV.Columns[9].ColumnName = "EcotPark";
                }
                else
                {
                    TablaV.Columns[7].ColumnName = "Acti.1";
                    TablaV.Columns[8].ColumnName = "Acti.2";
                    TablaV.Columns[9].ColumnName = "Acti.3";
                }

                //Hora | LQ | Documento | NombreDePax |
                //Celular | Counter | PAX | Islas |
                //Tubu | Otros | PuntoEmbarque |
                //Clasificacion | Condicion | Observaciones

                gvVerListado.Columns[1].Width =90;
                gvVerListado.Columns[3].Width =250;
                gvVerListado.Columns[4].Width =130;
                gvVerListado.Columns[5].Width =150;
                gvVerListado.Columns[10].Width =250;
                gvVerListado.Columns[11].Width =150;
                gvVerListado.Columns[12].Width =200;
                gvVerListado.Columns[13].Width =300;

                gvVerListado.Columns[1].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
                gvVerListado.Columns[6].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
                gvVerListado.Columns[7].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
                gvVerListado.Columns[8].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
                gvVerListado.Columns[9].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;

                this.lblCantVerLis.Text = gvVerListado.Rows.Count.ToString();
            }
        }
        private void gvProgramacion_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            try
            {
                if (gvProgramacion.Rows.Count > 0)
                {
                    if (gvProgramacion.CurrentCell.ColumnIndex ==6) generaFullDay();
                    else if (gvProgramacion.CurrentCell.ColumnIndex ==8)verListado();
                }
            }
            catch (Exception ex)
            {
                ex.ToString();
            }
        }
        private void btnAbrirImg_Click(object sender, EventArgs e)
        {
            if (validaIP() == true)
            {
                try
                {
                    if (txtruta.Text == ImageNula.ToString())
                    {
                        MessageBox.Show("No Hay Imagen Que Mostrar...", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    }
                    else
                    {
                        if (imagecaptura.Image != null)
                        {
                            FileInfo di = new FileInfo(txtruta.Text);
                            if (di.Exists) Process.Start(txtruta.Text);
                            else men.ErrorArchivo();
                        }
                        else
                        {
                            if (ximagen3.Image == null || txtruta.Text == "" || txtruta.Text.Length == 0)
                            {
                                men.SeleccioneUnDato();
                            }
                            else
                            {
                                FileInfo di = new FileInfo(txtruta.Text);
                                if (di.Exists) Process.Start(txtruta.Text);
                                else men.ErrorArchivo();
                            }
                        }
                    }
                }
                catch (Exception ex) { ex.ToString(); }
            }
            else
            {
                MessageBox.Show("ACTUALMENTE LAS IMAGENES DE PAGO SE ENCUENTRA EL SERVIDOR PRINCIPAL DE LA OFICINA...","AVISO",MessageBoxButtons.OK,MessageBoxIcon.Warning);
            }
        }
        public void traerDireccion(string data)
        {
            txtotroPuntoPartida.Text = "";
            if (cmdHotel.SelectedValue.ToString() != "0")
            {
                string[] registros = data.Split('¬');
                int nRegistros = registros.Length;
                string[] campos;
                var idCabezera = cmdHotel.SelectedValue.ToString();
                for (int i = 0; i < nRegistros; i++)
                {
                    campos = registros[i].Split('|');
                    if (campos[0] == "~") break;
                    else
                    {
                        if (idCabezera == campos[0])
                        {
                            txtotroPuntoPartida.Text = campos[1];
                            break;
                        }
                    }
                }
                txtotroPuntoPartida.SelectionStart = txtotroPuntoPartida.Text.Length;
                txtotroPuntoPartida.Focus();
            }
            else
            {
                txtotroPuntoPartida.Text = "";
                men.SeleccioneUnDato();
            }
        }
        private void cmdHotel_SelectionChangeCommitted(object sender, EventArgs e)
        {
            if (cmdHotel.DataSource != null)
            {
                traerDireccion(xlistas[13]);
            }
        }
        private void cmdRegion_SelectionChangeCommitted(object sender, EventArgs e)
        {
            traerHoPa();
        }
        private void txtPrecio_4_TextChanged(object sender, EventArgs e)
        {
            if (btnactivar.Enabled == false)
            {
                if (txtCantPasajeros.Text.Length > 0)
                {
                    calcularEntradaC();
                }
            }
        }
        private void txtCan4_TextChanged(object sender, EventArgs e)
        {
            if (btnactivar.Enabled == false)
            {
                if (txtCantPasajeros.Text.Length > 0)
                {
                    if (txtCan4.Text.Length == 0)
                    {
                        calcularEntradaC();
                    }
                    else
                    {
                        if (int.Parse(txtCan4.Text) > int.Parse(txtCantPasajeros.Text))
                        {
                            MessageBox.Show("LA CANTIDAD DE ACTIVIDADES ADICIONALES NO PUEDE SER MAYOR A LA CANTIDAD DE PASAJEROS...!!!", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                            txtCan4.Text = "";
                            txtCan4.Focus();
                        }
                        else
                        {
                            calcularEntradaC();
                        }
                    }
                }
            }
        }
        private void btnretornar_Click(object sender, EventArgs e)
        {
            this.tabControl2.SelectedIndex = 0;
        }
        public void buscarVerListado()
        {
            if (txtbusVerListado.Text != "")
            {
                string campo = "NombreDePax";
                string tipo = TablaV.Columns[campo].DataType.ToString();
                if (tipo.Contains("String")) vistaV.RowFilter = "[" + campo + "] Like '%" + txtbusVerListado.Text + "%'";
                else vistaV.RowFilter = "[" + campo + "] Like '%" + txtbusVerListado.Text + "%'";
                this.lblCantVerLis.Text = gvVerListado.Rows.Count.ToString();
            }
            else
            {
                vistaV.RowFilter = "";
                this.lblCantVerLis.Text = gvVerListado.Rows.Count.ToString();
            }
        }
        private void txtbusVerListado_TextChanged(object sender, EventArgs e)
        {
            buscarVerListado();
        }
        private void gvVerListado_ColumnAdded(object sender, DataGridViewColumnEventArgs e)
        {
            gvVerListado.Columns[e.Column.Index].SortMode = DataGridViewColumnSortMode.NotSortable;
        }
        private void txtbusVerListado_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                gvVerListado.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        private void gvVerListado_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.ShiftKey)txtbusVerListado.Focus();
        }
        private void txtExtraSol_TextChanged(object sender, EventArgs e)
        {
            if (txtExtraSol.Enabled == true)
            {
                calcularSaldo();
            }
        }
        private void txtExtraDol_TextChanged(object sender, EventArgs e)
        {
            if (txtExtraDol.Enabled == true)
            {
                calcularSaldo();
            }
        }
        #region ExportarVerListado
        private void exportarVerListado()
        {
            TEXTO.Document doc = new TEXTO.Document(TEXTO.PageSize.A4.Rotate(), 10, 10, 10, 10);
            SaveFileDialog saveFileDialog1 = new SaveFileDialog();
            saveFileDialog1.Title = "Guardar Reporte";
            saveFileDialog1.DefaultExt = "pdf";
            saveFileDialog1.Filter = "pdf Files (*.pdf)|*.pdf| All Files (*.*)|*.*";
            saveFileDialog1.FilterIndex = 2;
            saveFileDialog1.RestoreDirectory = true;
            string filename = "";
            if (saveFileDialog1.ShowDialog() == DialogResult.OK)
            {
                filename = saveFileDialog1.FileName;
            }
            if (filename.Trim() != "")
            {
                FileStream file = new FileStream(filename,
                FileMode.OpenOrCreate,
                FileAccess.ReadWrite,
                FileShare.ReadWrite);
                PDFT.PdfWriter.GetInstance(doc, file);
                doc.Open();
                string xtrans = "TRANS :  " + xTransporte;
                string xfecha = "FECHA :  " + dtimefechaLisPa.Text;//Convert.ToString(gvpanel.CurrentRow.Cells[5].Value);
                string xguia = "GUIA    :  " + xGuia;

                TEXTO.Chunk chunk = new TEXTO.Chunk(txtfullday.Text,TEXTO.FontFactory.GetFont("Calibri", 10, TEXTO.Font.BOLD));
                doc.Add(new TEXTO.Paragraph(chunk));
                doc.Add(new TEXTO.Paragraph("------------------------------------------------------------------------------------------"));
                doc.Add(new TEXTO.Paragraph(xtrans, TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD)));
                doc.Add(new TEXTO.Paragraph(xfecha, TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD)));
                doc.Add(new TEXTO.Paragraph(xguia, TEXTO.FontFactory.GetFont("Calibri", 9, TEXTO.Font.BOLD)));
                doc.Add(new TEXTO.Paragraph("                       "));
                GeneraDocuVerL(doc);
                generaTotalPAX_VerLista(doc);
                doc.Close();
                Process.Start(filename);
            }
        }
        public void GeneraDocuVerL(TEXTO.Document document)
        {
            int i;
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(13);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[13] {14,12,40,27,27,12,12,12,14,37,35,30,40};
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 100;
            datatable.DefaultCell.BackgroundColor = (TEXTO.BaseColor.LIGHT_GRAY);

            datatable.AddCell(new TEXTO.Phrase("Hora", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("LQ", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("Nombres", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("Celular", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("Counter", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("PAX", TEXTO.FontFactory.GetFont("Calibri", 8)));
           

            if(txtfullday.Text== "FULL DAY PARACAS - ICA")
            {
                datatable.AddCell(new TEXTO.Phrase("Islas", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Tubu", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Rese.N", TEXTO.FontFactory.GetFont("Calibri", 8)));
            }
            else if (txtfullday.Text == "FULL DAY LUNAHUANA")
            {
                datatable.AddCell(new TEXTO.Phrase("Cuatr", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Canopy", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Canota", TEXTO.FontFactory.GetFont("Calibri", 8)));
            }
            else if (txtfullday.Text == "FULL DAY AUCALLAMA - CHANCAY")
            {
                datatable.AddCell(new TEXTO.Phrase("Cast.Cha", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Haci.Hu", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Eco.Par", TEXTO.FontFactory.GetFont("Calibri", 8)));
            }
            else
            {
                datatable.AddCell(new TEXTO.Phrase("Acti.1", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Acti.2", TEXTO.FontFactory.GetFont("Calibri", 8)));
                datatable.AddCell(new TEXTO.Phrase("Acti.3", TEXTO.FontFactory.GetFont("Calibri", 8)));
            }
            
            datatable.AddCell(new TEXTO.Phrase("Punto.EM", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("Clasificacion", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("Condicion", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.AddCell(new TEXTO.Phrase("Observaciones", TEXTO.FontFactory.GetFont("Calibri", 8)));
            datatable.HeaderRows = 1;
            PDFT.PdfPCell cellHora,cellLQ, cellNombres,
            cellCelular,cellCounter,cellPax,
            cellIslas, cellTub, cellOtros, cellPuntoEM, 
            cellClasifi, cellCondicion, cellOBS = null;

            string xpartida = string.Empty;

            int xcount = gvVerListado.Rows.Count;
            for (i = 0; i < xcount; i++)
            {
                cellHora= new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[0, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7,TEXTO.Font.BOLD, TEXTO.BaseColor.RED)));
                cellHora.HorizontalAlignment =1;
                cellHora.UseAscender = false;
                datatable.AddCell(cellHora);

                cellLQ = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[1, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellLQ.HorizontalAlignment = 2;
                cellLQ.UseAscender = false;
                datatable.AddCell(cellLQ);

                cellNombres = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[3, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellNombres.HorizontalAlignment = 0;
                cellNombres.UseAscender = false;
                datatable.AddCell(cellNombres);

                cellCelular = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[4, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellCelular.HorizontalAlignment =1;
                cellCelular.UseAscender = false;
                datatable.AddCell(cellCelular);


                cellCounter= new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[5, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellCounter.HorizontalAlignment = 1;
                cellCounter.UseAscender = false;
                datatable.AddCell(cellCounter);

                cellPax = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[6, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellPax.HorizontalAlignment = 1;
                cellPax.UseAscender = false;
                datatable.AddCell(cellPax);

                cellIslas = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[7, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellIslas.HorizontalAlignment = 1;
                cellIslas.UseAscender = false;
                datatable.AddCell(cellIslas);

                cellTub = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[8, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellTub.HorizontalAlignment = 1;
                cellTub.UseAscender = false;
                datatable.AddCell(cellTub);

                cellOtros = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[9, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellOtros.HorizontalAlignment = 1;
                cellOtros.UseAscender = false;
                datatable.AddCell(cellOtros);

                if(gvVerListado[10, i].Value.ToString().Contains("MUNICIPALIDAD"))
                {
                    xpartida = "LOS OLIVOS ";
                }
                else if (gvVerListado[10, i].Value.ToString().Contains("PLAZA NORTE"))
                {
                    xpartida = "PZA NORTE ";
                }
                else if (gvVerListado[10, i].Value.ToString().Contains("AV AVIACION 2420"))
                {
                    xpartida = "AVIACION ";
                }
                else
                {
                    xpartida = gvVerListado[10, i].Value.ToString();
                }
                cellPuntoEM = new PDFT.PdfPCell(new TEXTO.Phrase(xpartida, TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellPuntoEM.HorizontalAlignment = 0;
                cellPuntoEM.UseAscender = false;
                datatable.AddCell(cellPuntoEM);

                cellClasifi = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[11, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellClasifi.HorizontalAlignment = 1;
                cellClasifi.UseAscender = false;
                datatable.AddCell(cellClasifi);

                if (gvVerListado[12, i].Value.ToString() == "CANCELADO" || gvVerListado[12, i].Value.ToString() == "CREDITO")
                {
                    cellCondicion = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[12, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                    cellCondicion.HorizontalAlignment = 1;
                    cellCondicion.UseAscender = false;
                    datatable.AddCell(cellCondicion);
                }
                else
                {
                    cellCondicion = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[12, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7, TEXTO.Font.BOLD, TEXTO.BaseColor.RED)));
                    cellCondicion.HorizontalAlignment = 1;
                    cellCondicion.UseAscender = false;
                    datatable.AddCell(cellCondicion);
                }

                cellOBS = new PDFT.PdfPCell(new TEXTO.Phrase(gvVerListado[13, i].Value.ToString(), TEXTO.FontFactory.GetFont("Calibri", 7)));
                cellOBS.HorizontalAlignment = 0;
                cellOBS.UseAscender = false;
                datatable.AddCell(cellOBS);

                datatable.CompleteRow();
            }
            document.Add(datatable);
        }
        public void generaTotalPAX_VerLista(TEXTO.Document document)
        {
            int xPax = 0;
            foreach (DataGridViewRow row in gvVerListado.Rows)
            {
                xPax += Convert.ToInt32(row.Cells[6].Value);
            }
            PDFT.PdfPTable datatable = new PDFT.PdfPTable(13);
            datatable.DefaultCell.Padding = 3;
            float[] headerwidths = new float[13] { 14, 12, 40, 27, 27, 12, 12, 12, 14, 37, 35, 30, 40 };
            datatable.SetWidths(headerwidths);
            datatable.WidthPercentage = 100;
            datatable.DefaultCell.Border = 0;
            datatable.DefaultCell.BorderWidth = 0;

            PDFT.PdfPCell cellHora, cellLQ, cellNombres,
            cellCelular, cellCounter, cellPax,
            cellIslas, cellTub, cellOtros, cellPuntoEM,
            cellClasifi, cellCondicion, cellOBS = null;

            cellHora = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellHora.HorizontalAlignment = 2;
            cellHora.Border = 0;

            cellLQ = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellLQ.HorizontalAlignment = 2;
            cellLQ.Border = 0;

            cellNombres = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellNombres.HorizontalAlignment = 0;
            cellNombres.Border = 0;

            cellCelular = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellCelular.HorizontalAlignment = 1;
            cellCelular.Border = 0;

            cellCounter= new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellCounter.HorizontalAlignment = 1;
            cellCounter.Border = 0;

            cellPax = new PDFT.PdfPCell(new TEXTO.Phrase(xPax.ToString("N0"), TEXTO.FontFactory.GetFont("Calibri", 8, TEXTO.Font.BOLD)));
            cellPax.HorizontalAlignment = 1;
            cellPax.Border = 0;

            cellIslas = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellIslas.HorizontalAlignment = 1;
            cellIslas.Border = 0;

            cellTub = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellTub.HorizontalAlignment = 1;
            cellTub.Border = 0;

            cellOtros = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellOtros.HorizontalAlignment = 1;
            cellOtros.Border = 0;

            cellPuntoEM = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellPuntoEM.HorizontalAlignment = 0;
            cellPuntoEM.Border = 0;

            cellClasifi = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellClasifi.HorizontalAlignment = 1;
            cellClasifi.Border = 0;

            cellCondicion = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellCondicion.HorizontalAlignment = 1;
            cellCondicion.Border = 0;

            cellOBS = new PDFT.PdfPCell(new TEXTO.Phrase("", TEXTO.FontFactory.GetFont("Calibri", 7)));
            cellOBS.HorizontalAlignment = 0;
            cellOBS.Border = 0;

            datatable.AddCell(cellHora);
            datatable.AddCell(cellLQ);
            datatable.AddCell(cellNombres);
            datatable.AddCell(cellCelular);
            datatable.AddCell(cellCounter);
            datatable.AddCell(cellPax);
            datatable.AddCell(cellIslas);
            datatable.AddCell(cellTub);
            datatable.AddCell(cellOtros);
            datatable.AddCell(cellPuntoEM);
            datatable.AddCell(cellClasifi);
            datatable.AddCell(cellCondicion);
            datatable.AddCell(cellOBS);
            document.Add(datatable);
        }
        #endregion

        private void _link_Exportar_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            if (gvVerListado.Rows.Count == 0)
            {
                men.datosVacios();
            }
            else
            {
                frmAgregar = new FrmAgregar();
                frmAgregar.xListas = xlistas[0].ToString();
                frmAgregar.xServicio = txtfullday.Text;
                frmAgregar.xFecha= dtimefechaLisPa.Text;
                frmAgregar.ShowDialog();
                if (frmAgregar.xAviso == 0)
                {
                    //
                }
                else
                {
                    xTransporte = frmAgregar.xTransporte;
                    xGuia = frmAgregar.xGuia;
                    exportarVerListado();
                }
            }
        }
        public void dgv(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            TextBox texto2 = new TextBox();
            texto2.Text = "";
            for (int i = 0; i < texto2.Text.Length; i++)
            {
                if (texto2.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }

            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }
        private void gvProgramacion_EditingControlShowing(object sender, DataGridViewEditingControlShowingEventArgs e)
        {
            e.Control.KeyPress -= new KeyPressEventHandler(dgv);
            if (gvProgramacion.CurrentCell.ColumnIndex == 4)
            {
                TextBox texto = e.Control as TextBox;
                if (texto != null)
                {
                    texto.KeyPress -= new KeyPressEventHandler(dgv);
                    texto.KeyPress += new KeyPressEventHandler(dgv);
                }
            }
        }
        public void guardarMaxPax()
        {
            int count = 0;
            count = gvProgramacion.Rows.Count;
            string xvalue = string.Empty;
            if (gvProgramacion.Rows.Count > 0)
            {
                for (int i = 0; i < count; i++)
                {
                    xvalue += Convert.ToString(gvProgramacion.Rows[i].Cells[9].Value);
                    xvalue += "|";
                    if (Convert.ToString(gvProgramacion.Rows[i].Cells[4].Value) == "" || gvProgramacion.Rows[i].Cells[4].Value == null)
                    {
                        xvalue += "0";
                    }
                    else
                    {
                        xvalue += Convert.ToString(gvProgramacion.Rows[i].Cells[4].Value);
                    }
                    if (i == count - 1) break;
                    else xvalue += ";";
                }
                AccesoDatos daSQL = new AccesoDatos("con");
                string rpt = daSQL.ejecutarComando("uspEditaCantMaxPax", "@ListaOrden", xvalue);
                if (rpt == "")
                {
                    men.ErrorGuardado();
                }
                else
                {
                    men.GuardoCorrecto();
                    listarPanelPrin();
                }
            }
            else
            {
                men.datosVacios();
            }
        }
        private void btnGuardarMAX_Click(object sender, EventArgs e)
        {
            guardarMaxPax();
        }
        public void exportarVentas(string xfile)
        {
            int x = this.gvVerListado.Rows.Count;
            Stopwatch oReloj = new Stopwatch();
            oReloj.Start();
            DataTable dt = new DataTable();
            dt.Columns.Add("Hora", typeof(String));
            dt.Columns.Add("LQ", typeof(String));
            dt.Columns.Add("NombreApellidos", typeof(String));
            dt.Columns.Add("Celular", typeof(String));
            dt.Columns.Add("Counter", typeof(String));
            dt.Columns.Add("PAX", typeof(int));

            if (txtfullday.Text == "FULL DAY PARACAS - ICA")
            {
                dt.Columns.Add("Islas", typeof(String));
                dt.Columns.Add("Tubu", typeof(String));
                dt.Columns.Add("Rese.N", typeof(String));
            }
            else if (txtfullday.Text == "FULL DAY LUNAHUANA")
            {
                dt.Columns.Add("Cuatri", typeof(String));
                dt.Columns.Add("Canopy", typeof(String));
                dt.Columns.Add("Canota", typeof(String));
            }
            else if (txtfullday.Text == "FULL DAY AUCALLAMA - CHANCAY")
            {
                dt.Columns.Add("Cast.Cha", typeof(String));
                dt.Columns.Add("Haci.Hu", typeof(String));
                dt.Columns.Add("EcotPark", typeof(String));
            }
            else
            {
                dt.Columns.Add("Acti.1", typeof(String));
                dt.Columns.Add("Acti.2", typeof(String));
                dt.Columns.Add("Acti.3", typeof(String));
            }

            dt.Columns.Add("PuntoEmbarque", typeof(String));
            dt.Columns.Add("Clasificacion", typeof(String));
            dt.Columns.Add("Condicion", typeof(String));
            dt.Columns.Add("Observaciones", typeof(String));
            dt.Columns.Add("PuntoParida", typeof(String));
            dt.Columns.Add("Hotel", typeof(String));

            string xpartida = string.Empty;
            for (int i = 0; i < x; i++)
            {
                dt.Rows.Add();
                dt.Rows[dt.Rows.Count - 1][0] = gvVerListado.Rows[i].Cells[0].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][1] = gvVerListado.Rows[i].Cells[1].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][2] = gvVerListado.Rows[i].Cells[3].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][3] = gvVerListado.Rows[i].Cells[4].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][4] = gvVerListado.Rows[i].Cells[5].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][5] = gvVerListado.Rows[i].Cells[6].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][6] = gvVerListado.Rows[i].Cells[7].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][7] = gvVerListado.Rows[i].Cells[8].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][8] = gvVerListado.Rows[i].Cells[9].Value.ToString();

                if (gvVerListado[10, i].Value.ToString().Contains("MUNICIPALIDAD"))
                {
                    xpartida = "LOS OLIVOS ";
                }
                else if (gvVerListado[10, i].Value.ToString().Contains("PLAZA NORTE"))
                {
                    xpartida = "PZA NORTE ";
                }
                else if (gvVerListado[10, i].Value.ToString().Contains("AV AVIACION 2420"))
                {
                    xpartida = "AVIACION ";
                }
                else
                {
                    xpartida = gvVerListado[10, i].Value.ToString();
                }

                dt.Rows[dt.Rows.Count - 1][9] = xpartida;
                              
                dt.Rows[dt.Rows.Count - 1][10] = gvVerListado.Rows[i].Cells[11].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][11] = gvVerListado.Rows[i].Cells[12].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][12] = gvVerListado.Rows[i].Cells[13].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][13] = gvVerListado.Rows[i].Cells[14].Value.ToString();
                dt.Rows[dt.Rows.Count - 1][14] = gvVerListado.Rows[i].Cells[15].Value.ToString();
            }
            string folderPath = xfile;
            using (XLWorkbook wb = new XLWorkbook())
            {
                var worksheet = wb.Worksheets.Add(dt, "PreListado");
                worksheet.Range("A1:O1").Style
                     .Font.SetFontSize(13)
                     .Font.SetBold(true)
                     .Font.SetFontColor(XLColor.White)
                     .Fill.SetBackgroundColor(XLColor.FromHtml("#3377FF"));

                var c1 = worksheet.Column(1);
                c1.Width = 13;
                var c2 = worksheet.Column(2);
                c2.Width = 13;
                var c3 = worksheet.Column(3);
                c3.Width =42;
                var col4 = worksheet.Column(4);
                col4.Width =20;
                var col5 = worksheet.Column(5);
                col5.Width =20;
                var col6 = worksheet.Column(6);
                col6.Width = 12;
                var col7 = worksheet.Column(7);
                col7.Width =13;
                var col8 = worksheet.Column(8);
                col8.Width =13;
                var col9 = worksheet.Column(9);
                col9.Width = 13;
                var col10 = worksheet.Column(10);
                col10.Width =50;
                var col11 = worksheet.Column(11);
                col11.Width =25;
                var col12 = worksheet.Column(12);
                col12.Width =25;
                var col13 = worksheet.Column(13);
                col13.Width =50;

                var col14 = worksheet.Column(14);
                col14.Width =40;

                var col15 = worksheet.Column(15);
                col15.Width = 30;

                for (int i =2; i <=x+1; i++)
                {
                    worksheet.Cell(i, 1).Style.NumberFormat.Format = "@";
                    worksheet.Cell(i, 4).Style.NumberFormat.Format = "@";
                    worksheet.Cell(i, 4).Style.NumberFormat.Format = "@";
                    worksheet.Cell(i, 6).Style.NumberFormat.Format = "@";
                    worksheet.Cell(i, 7).Style.NumberFormat.Format = "@";
                    worksheet.Cell(i, 8).Style.NumberFormat.Format = "@";
                    worksheet.Cell(i, 9).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(i, 2).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(i, 4).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(i, 5).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(i, 6).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(i, 7).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(i, 8).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(i, 9).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(i, 11).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(i, 1).Style.Font.SetFontColor(XLColor.Red);
                }
                wb.SaveAs(folderPath);
            }
            oReloj.Stop();
            Process.Start(xrut);
            xrut = string.Empty;
        }
        private void btnExcel_Click(object sender, EventArgs e)
        {
            if (gvVerListado.Rows.Count > 0)
            {
                using (SaveFileDialog sfd = new SaveFileDialog() { Filter = "Excel Workbook|*.xlsx", ValidateNames = true })
                {
                    if (sfd.ShowDialog() == DialogResult.OK)
                    {
                        xrut = sfd.FileName.ToString();
                        exportarVentas(xrut);
                    }
                }
            }
            else
            {
                men.datosVacios();
            }
        }
        private void txtHoraPar_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                txtVisitasExcursion.SelectionStart = txtVisitasExcursion.Text.Length;
                txtVisitasExcursion.Focus();
            }
            else
            {
                e.Handled = false;
            }
        }
        public void agregarProgramacion()
        {
            if (cmdServiciosAG.Text == "(SELECCIONE)")
            {
                MessageBox.Show("SELECCIONE UN PROGRAMA PARA AGREGAR A LA LISTA...", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                cmdServiciosAG.Focus();
            }
            else
            {
                string xvalue = string.Empty;
                xvalue = cmdServiciosAG.SelectedValue.ToString() + "|" +
                         cmdServiciosAG.Text + "|" + dtimeProgramacion.Value.ToString("MM/dd/yyyy");
                AccesoDatos daSQL = new AccesoDatos("con");
                string rpt = daSQL.ejecutarComando("uspInsertaProgramacion", "@Data", xvalue);
                if (string.IsNullOrEmpty(rpt))
                {
                    men.ErrorGuardado();
                }
                else
                {
                    if (rpt.Equals("EXISTE"))
                    {
                        MessageBox.Show("YA EXISTE EL PROGRAMA EN LA FECHA SELECCIONADA...", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    }
                    else
                    {
                        men.GuardoCorrecto();
                        listarPanelPrin();
                    }
                }
            }
        }
        private void btnagregar_Click(object sender, EventArgs e)
        {
            agregarProgramacion();
        }
        public bool calculaAcuentaLQ()
        {
            bool xEscorrecto = false;
            int x = 0;
            x = gvliquidacion.Rows.Count;
            double vtotal = 0;
            double xsaldo = 0;
            double xAcuenta = 0;
            xAcuenta = double.Parse(txtAcuentaL.Text);
            xsaldo =xSaldo_Fijo;
            if (x > 0)
            {
                for (int i = 0; i < x; i++)
                {
                    if (Convert.ToString(gvliquidacion.Rows[i].Cells[9].Value).Equals("P"))
                    {
                        vtotal += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                    }
                }
            }
            vtotal = vtotal + xAcuenta;
            xEscorrecto = (vtotal > xsaldo) ? true : false;
            return xEscorrecto;
        }
        public bool calculaAcuentaLQ_B()
        {
            bool xEscorrecto = false;
            int x = 0;
            x = gvliquidacion.Rows.Count;
            double vtotal = 0;
            double xsaldo = 0;
            xsaldo = xSaldo_Fijo;
            if (x > 0)
            {
                for (int i = 0; i < x; i++)
                {
                    if (Convert.ToString(gvliquidacion.Rows[i].Cells[9].Value).Equals("P"))
                    {
                        vtotal += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                    }
                }
            }
            xEscorrecto = (vtotal > xsaldo) ? true : false;
            return xEscorrecto;
        }

        public void calculaTotalLQ()
        {
            int x = 0;
            x = gvliquidacion.Rows.Count;

            //SOLES

            double vEfecSol = 0;
            double vDepoSol = 0;
            double vtotalSol = 0;

            double vEfecSol_P = 0;
            double vDepoSol_P = 0;
            double vtotalSol_P = 0;

            //DOLARES 

            double vEfecDol = 0;
            double vDepoDol = 0;
            double vtotalDol = 0;

            double vEfecDol_P = 0;
            double vDepoDol_P = 0;
            double vtotalDol_P = 0;

            if (x > 0)
            {
                for (int i = 0; i < x; i++)
                {
                    if (Convert.ToString(gvliquidacion.Rows[i].Cells[9].Value) != "A")
                    {
                        if (Convert.ToString(gvliquidacion.Rows[i].Cells[2].Value) == "EFECTIVO")
                        {
                            if (Convert.ToString(gvliquidacion.Rows[i].Cells[3].Value) == "SOLES")
                                vEfecSol += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                            else
                                vEfecDol += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                        }
                        else
                        {
                            if (Convert.ToString(gvliquidacion.Rows[i].Cells[3].Value) == "SOLES")
                                vDepoSol += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                            else
                                vDepoDol += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                        }
                        if (Convert.ToString(gvliquidacion.Rows[i].Cells[9].Value) == "P")
                        {
                            if (Convert.ToString(gvliquidacion.Rows[i].Cells[2].Value) == "EFECTIVO")
                            {
                                if (Convert.ToString(gvliquidacion.Rows[i].Cells[3].Value) == "SOLES")
                                    vEfecSol_P += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                                else
                                    vEfecDol_P += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                            }
                            else
                            {
                                if (Convert.ToString(gvliquidacion.Rows[i].Cells[3].Value) == "SOLES")
                                    vDepoSol_P += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                                else
                                    vDepoDol_P += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                            }
                        }
                    }
                }
            }
            //SOLES
            vtotalSol = vEfecSol + vDepoSol;
            vtotalSol_P = vEfecSol_P + vDepoSol_P;

            lblEfectivoSol.Text = vEfecSol.ToString("N2");
            lblDepositoSol.Text = vDepoSol.ToString("N2");
            lbltotalSol.Text = vtotalSol.ToString("N2");

            //DOLARES

            vtotalDol = vEfecDol + vDepoDol;
            vtotalDol_P = vEfecDol_P + vDepoDol_P;

            lblefecDolar.Text = vEfecDol.ToString("N2");
            lblDepoDolar.Text = vDepoDol.ToString("N2");
            lblTotalDolarLQ.Text = vtotalDol.ToString("N2");

            if(cmdmoneda.Text=="SOLES")
            {
                if (txtAcuentaL.Enabled == true) calcularSaldoB(vEfecSol_P, vDepoSol_P, vtotalSol_P);
            }
            else
            {
                if (txtAcuentaL.Enabled == true) calcularSaldoB(vEfecDol_P, vDepoDol_P, vtotalDol_P);
            }
        }
        //
        public void calculaTotalLQ_C()
        {
            int x = 0;
            x = gvliquidacion.Rows.Count;

            //Soles
            double vEfecSol_A = 0;
            double vDepoSol_A = 0;
            double vtotalSol_A = 0;

            vEfecSol_A = double.Parse(lblEfectivoSol.Text);
            vDepoSol_A = double.Parse(lblDepositoSol.Text);
            vtotalSol_A = double.Parse(lbltotalSol.Text);

            double vEfecSol = 0;
            double vDepoSol = 0;
            double vtotalSol = 0;

            //Dolares
            double vEfecDol_A = 0;
            double vDepoDol_A = 0;
            double vtotalDol_A = 0;

            vEfecDol_A = double.Parse(lblefecDolar.Text);
            vDepoDol_A = double.Parse(lblDepoDolar.Text);
            vtotalDol_A = double.Parse(lblTotalDolarLQ.Text);

            double vEfecDol = 0;
            double vDepoDol = 0;
            double vtotalDol = 0;

            if (x > 0)
            {
                for (int i = 0; i < x; i++)
                {
                    if (Convert.ToString(gvliquidacion.Rows[i].Cells[9].Value) == "A")
                    {
                        if (Convert.ToString(gvliquidacion.Rows[i].Cells[2].Value) == "EFECTIVO")
                        {
                            if (Convert.ToString(gvliquidacion.Rows[i].Cells[3].Value) == "SOLES")
                                vEfecSol += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                            else
                                vEfecDol += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                        }
                        else
                        {
                            if (Convert.ToString(gvliquidacion.Rows[i].Cells[3].Value) == "SOLES")
                                vDepoSol += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                            else
                                vDepoDol += Convert.ToDouble(gvliquidacion.Rows[i].Cells[5].Value);
                        }
                    }
                }
            }
            vtotalSol = vEfecSol + vDepoSol;
            vtotalDol = vEfecDol + vDepoDol;

            lblEfectivoSol.Text = (vEfecSol_A - vEfecSol).ToString("N2");
            lblDepositoSol.Text = (vDepoSol_A - vDepoSol).ToString("N2");
            lbltotalSol.Text = (vtotalSol_A - vtotalSol).ToString("N2");

            lblefecDolar.Text = (vEfecDol_A - vEfecDol).ToString("N2");
            lblDepoDolar.Text = (vDepoDol_A - vDepoDol).ToString("N2");
            lblTotalDolarLQ.Text = (vtotalDol_A - vtotalDol).ToString("N2");

            if (cmdmoneda.Text == "SOLES")
            {
                if (txtAcuentaL.Enabled == true) calcularSaldoEli(vEfecSol, vDepoSol, vtotalSol);
            }
            else
            {
                if (txtAcuentaL.Enabled == true) calcularSaldoEli(vEfecDol, vDepoDol, vtotalDol);
            }
        }
        public void guardarLQ(int xav)
        {
            if (txtAcuentaL.Text.Length == 0)
            {
                MessageBox.Show("INGRESE EL MONTO QUE LE DIERON ACUENTA", "ACUENTA", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtAcuentaL.Focus();
            }
            else
            {
                if (calculaAcuentaLQ() == true)
                {
                    MessageBox.Show("EL MONTO QUE INGRESO, SUPERA EL SALDO ACTUAL...POR FAVOR VERIFIQUE SUS LIQUIDACIONES.", "ACUENTA", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                    txtAcuentaL.SelectionStart = txtAcuentaL.Text.Length;
                    txtAcuentaL.Focus();
                }
                else
                {
                    string xvalue = string.Empty;
                    string xIdLQ = string.Empty;
                    xIdLQ = (xav == 0) ? "0" : lblIdLQ.Text;
                    xvalue = xIdLQ + "|" + lblIdNota.Text +
                    "|" + DateTime.Now.ToString("MM-dd-yyyy") + "|EFECTIVO|" + cmdmoneda.Text + "|0.000|" + decimal.Parse(txtAcuentaL.Text) +
                    "|-||" + decimal.Parse(txtAcuentaL.Text) + "|" + xUsuario + "|";
                    AccesoDatos daSQL = new AccesoDatos("con");
                    string rpt = daSQL.ejecutarComando("uspInsertarLQFD", "@Columna", xvalue);
                    if (!string.IsNullOrEmpty(rpt))
                    {
                        if (rpt.Equals("true"))
                        {
                            txtAcuentaL.Text = "";
                            listaLQ();                        
                            txtAcuenta.Focus();
                        }
                    }
                    else
                    {
                        men.ErrorGuardado();
                    }
                }
            }
        }
        public void listaLQ()
        {
            gvliquidacion.Rows.Clear();
            gvliquidacion.Refresh();
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("upsListaLQFD", "@NotaId", this.lblIdNota.Text);
            if (!string.IsNullOrEmpty(rpt))
            {
                Cadena.llenaTabla8(gvliquidacion,rpt);
                validarEmitidos();
                calculaTotalLQ();
            }
        }
        public void listaLQ_E()
        {
            gvliquidacion.Rows.Clear();
            gvliquidacion.Refresh();
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("upsListaLQFD", "@NotaId", this.lblIdNota.Text);
            if (!string.IsNullOrEmpty(rpt))
            {
                Cadena.llenaTabla8(gvliquidacion, rpt);
                validarEmitidos();
            }
        }
        public void eliminarLQ()
        {
            DialogResult resul = new DialogResult();
            resul = MessageBox.Show("Esta seguro que Desea eliminar el dato Seleccionado?", "ELIMINAR", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
            if (resul == DialogResult.OK)
            {
                string vEstado = string.Empty;
                vEstado = Convert.ToString(gvliquidacion.CurrentRow.Cells[9].Value);
                gvliquidacion.CurrentRow.Cells[9].Value = "A";

                if (vEstado.Equals("P")) calculaTotalLQ();
                else calculaTotalLQ_C();

                gvliquidacion.CurrentRow.Cells[9].Value = vEstado;
                decimal zAcuenta = 0;
                decimal zEfectivo = 0;
                decimal zDeposito = 0;

                zAcuenta = (txtAcuenta.Text.Length == 0) ? zAcuenta = 0 : zAcuenta = decimal.Parse(txtAcuenta.Text);
                zEfectivo = (txtefectivo.Text.Length == 0) ? zEfectivo = 0 : zEfectivo = decimal.Parse(txtefectivo.Text);
                zDeposito = (txtdeposito.Text.Length == 0) ? zDeposito = 0 : zDeposito = decimal.Parse(txtdeposito.Text);

                string xvalue = string.Empty;

                xvalue = Convert.ToString(gvliquidacion.CurrentRow.Cells[0].Value) + "|" + lblIdNota.Text + "|" + zAcuenta + "|" +
                    zEfectivo + "|" + zDeposito + "|" + txtSaldo.Text + "|" + xUsuario + "|" + vEstado;

                AccesoDatos daSQL = new AccesoDatos("con");
                string rpt = daSQL.ejecutarComando("uspEliminarLQFD", "@Orden", xvalue);
                if (!string.IsNullOrEmpty(rpt))
                {
                    if (vEstado.Equals("P"))
                    {
                        listaLQ();
                    }
                    else
                    {
                        listaLQ_E();
                        xAcuenta_Fijo = double.Parse(txtAcuenta.Text);
                        xSaldo_Fijo = double.Parse(txtSaldo.Text);
                        xEfec_Fijo = double.Parse(txtefectivo.Text);
                        xDepo_Fijo = double.Parse(txtdeposito.Text);
                        listar();
                    }
                    gvliquidacion.Focus();
                }
                else
                {
                    men.EliminoError();
                }
            }
        }
        private void gvliquidacion_CellEnter(object sender, DataGridViewCellEventArgs e)
        {
            if (gvliquidacion.Rows.Count > 0)
            {
                if (e.ColumnIndex == 2 || e.ColumnIndex == 3 || e.ColumnIndex == 6)
                {
                    gvliquidacion.BeginEdit(false);
                    if ((gvliquidacion.EditingControl) != null)
                    {
                        ComboBox cmb = new ComboBox();
                        cmb = gvliquidacion.EditingControl as ComboBox;
                        cmb.DroppedDown = true;
                    }
                }
            }
        }
        private void gvliquidacion_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Delete)
            {
                if (btnActivarB.Enabled == false)
                {
                    if (gvliquidacion.Rows.Count > 0)
                    {
                        eliminarLQ();
                    }
                }
                else
                {
                    men.activeCajas();
                }
            }
        }
        private void gvliquidacion_EditingControlShowing(object sender, DataGridViewEditingControlShowingEventArgs e)
        {
            e.Control.KeyPress -= new KeyPressEventHandler(dgv);
            if (gvliquidacion.CurrentCell.ColumnIndex == 4 || gvliquidacion.CurrentCell.ColumnIndex == 5)
            {
                TextBox texto = e.Control as TextBox;
                if (texto != null)
                {
                    texto.KeyPress -= new KeyPressEventHandler(dgv);
                    texto.KeyPress += new KeyPressEventHandler(dgv);
                }
            }
            else if (gvliquidacion.CurrentCell.ColumnIndex == 1 || gvliquidacion.CurrentCell.ColumnIndex ==7)
            {
                DataGridViewTextBoxEditingControl text = (DataGridViewTextBoxEditingControl)e.Control;
                text.KeyPress -= new KeyPressEventHandler(textbox_KeyPress);
                text.KeyPress += new KeyPressEventHandler(textbox_KeyPress);
            }
        }
        private void textbox_KeyPress(object sender, KeyPressEventArgs e)
        {
            e.KeyChar = char.ToUpper(e.KeyChar);
        }
        private void txtAcuentaL_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)13)
            {
                e.Handled = true;
                if (txtAcuentaL.Text.Length == 0 && gvliquidacion.Rows.Count > 0)
                {
                    gvliquidacion.Focus();
                }
                else
                {
                    guardarLQ(0);
                }
            }
            if (e.KeyChar == 8)
            {
                e.Handled = false;
                return;
            }
            bool IsDec = false;
            int nroDec = 0;
            for (int i = 0; i < txtAcuentaL.Text.Length; i++)
            {
                if (txtAcuentaL.Text[i] == '.')
                    IsDec = true;

                if (IsDec && nroDec++ >= 2)
                {
                    e.Handled = true;
                    return;
                }
            }
            if (e.KeyChar >= 48 && e.KeyChar <= 57)
                e.Handled = false;
            else if (e.KeyChar == 46)
                e.Handled = (IsDec) ? true : false;
            else
                e.Handled = true;
        }

        private void gvliquidacion_CellEndEdit(object sender, DataGridViewCellEventArgs e)
        {
            if (gvliquidacion.Rows.Count > 0)
            {
                if (gvliquidacion.Columns[e.ColumnIndex].Name == "FormaPago" ||
                gvliquidacion.Columns[e.ColumnIndex].Name == "Moneda" ||
                gvliquidacion.Columns[e.ColumnIndex].Name == "TipoCambio" ||
                gvliquidacion.Columns[e.ColumnIndex].Name == "Importe")
                {
                    if (calculaAcuentaLQ_B() == true)
                    {
                        MessageBox.Show("EL MONTO QUE INGRESO, SUPERA EL SALDO ACTUAL...POR FAVOR VERIFIQUE SUS LIQUIDACIONES.", "ACUENTA", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                        gvliquidacion.CurrentRow.Cells[5].Value = "0.00";
                    }
                    calculaTotalLQ();
                    editarLQ_Grilla();
                }
                else
                {
                    //EntidadBancaria
                    if (gvliquidacion.Columns[e.ColumnIndex].Name == "EntidadBancaria" || gvliquidacion.Columns[e.ColumnIndex].Name == "NroOperacion") lblidCliente.Visible = false;
                    editarLQ_Grilla();
                }
            }
        }
        private void gvliquidacion_CurrentCellDirtyStateChanged(object sender, EventArgs e)
        {
            if (gvliquidacion.CurrentCell.ColumnIndex ==2|| gvliquidacion.CurrentCell.ColumnIndex ==3|| gvliquidacion.CurrentCell.ColumnIndex ==6)
            {
                if (gvliquidacion.IsCurrentCellDirty)
                {
                    gvliquidacion.CommitEdit(DataGridViewDataErrorContexts.Commit);
                    calculaTotalLQ();
                }
            }
        }
        private void txtcliente_TextChanged(object sender, EventArgs e)
        {
            txtcliente.CharacterCasing = CharacterCasing.Upper;
        }
        public void validarEmitidos()
        {
            int xcount = 0;
            xcount = gvliquidacion.Rows.Count;
            if (xcount > 0)
            {
                for (int i = 0; i < xcount; i++)
                {
                    if (Convert.ToString(gvliquidacion.Rows[i].Cells[9].Value) == "E")
                    {
                        gvliquidacion.Rows[i].Cells[1].ReadOnly = true;
                        gvliquidacion.Rows[i].Cells[2].ReadOnly = true;
                        gvliquidacion.Rows[i].Cells[3].ReadOnly = true;
                        gvliquidacion.Rows[i].Cells[4].ReadOnly = true;
                        gvliquidacion.Rows[i].Cells[5].ReadOnly = true;
                        gvliquidacion.Rows[i].Cells[6].ReadOnly = true;
                        gvliquidacion.Rows[i].Cells[7].ReadOnly = true;
                    }
                    else
                    {
                        //gvliquidacion.Rows[i].Cells[1].ReadOnly = true;
                        gvliquidacion.Rows[i].Cells[3].ReadOnly = true;
                    }
                }
            }
        }

        public bool validarEmitidosG()
        {
            int xcount = 0;
            bool xEscorrecto = false;
            xcount = gvliquidacion.Rows.Count;
            if (xcount > 0)
            {
                for (int i = 0; i < xcount; i++)
                {
                    if (Convert.ToString(gvliquidacion.Rows[i].Cells[9].Value) == "P")
                    {
                        xEscorrecto = true;
                        break;
                    }
                }
            }
            return xEscorrecto;
        }
        private void btnActivarB_Click(object sender, EventArgs e)
        {
            if (btnactivar.Enabled ==false)
            {
                MessageBox.Show("PARA AGREGAR LIQUIDACIONES DE PAGO, LA EDICION PRINCIPAL NO DEBE ESTAR ACTIVA.", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
            }
            else
            {
                txtAcuentaL.Enabled = true;
                btnActivarB.Enabled = false;
                btnGuardarB.Enabled = true;
                gvliquidacion.ReadOnly = false;
                txtAcuentaL.Text = "";
                validarEmitidos();
                txtAcuentaL.Focus();
            }
        }

        public void editarLQ_Grilla()
        {
            //Id | Recibido | FormaPago | Moneda | TipoCambio | Importe | EntidadBancaria | NroOperacion | AcuentaG | Estado
            string xvalue = string.Empty;
            xvalue += Convert.ToString(gvliquidacion.CurrentRow.Cells[0].Value);
            xvalue += "|";
            xvalue += Convert.ToDateTime(gvliquidacion.CurrentRow.Cells[1].Value).ToString("MM-dd-yyyy");
            xvalue += "|";
            xvalue += Convert.ToString(gvliquidacion.CurrentRow.Cells[2].Value);
            xvalue += "|";
            xvalue += Convert.ToString(gvliquidacion.CurrentRow.Cells[3].Value);
            xvalue += "|";
            xvalue += Convert.ToString(gvliquidacion.CurrentRow.Cells[4].Value);
            xvalue += "|";
            xvalue += Convert.ToDecimal(gvliquidacion.CurrentRow.Cells[5].Value);
            xvalue += "|";
            xvalue += Convert.ToString(gvliquidacion.CurrentRow.Cells[6].Value);
            xvalue += "|";
            xvalue += Convert.ToString(gvliquidacion.CurrentRow.Cells[7].Value);
            xvalue += "|";
            xvalue += Convert.ToDecimal(gvliquidacion.CurrentRow.Cells[8].Value);
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("uspEditarLQ_Grilla", "@Columna", xvalue);
            if (string.IsNullOrEmpty(rpt))
            {
                men.ErrorGuardado();
            }
        }
        public void editarLQ()
        {
            //Id | Recibido | FormaPago | Moneda | TipoCambio | Importe | EntidadBancaria | NroOperacion | AcuentaG | Estado

            decimal zAcuenta = 0;
            decimal zEfectivo = 0;
            decimal zDeposito = 0;

            zAcuenta = (txtAcuenta.Text.Length == 0) ? zAcuenta = 0 : zAcuenta = decimal.Parse(txtAcuenta.Text);
            zEfectivo = (txtefectivo.Text.Length == 0) ? zEfectivo = 0 : zEfectivo = decimal.Parse(txtefectivo.Text);
            zDeposito = (txtdeposito.Text.Length == 0) ? zDeposito = 0 : zDeposito = decimal.Parse(txtdeposito.Text);

            string xvalue = string.Empty;

            xvalue = lblIdNota.Text + "|" + zAcuenta + "|" + zEfectivo + "|" + zDeposito + "|" + txtSaldo.Text+"|"+xUsuario+"[";

            int count = gvliquidacion.Rows.Count;
            for (int i = 0; i < count; i++)
            {
                xvalue += Convert.ToString(gvliquidacion.Rows[i].Cells[0].Value);
                xvalue += "|";
                xvalue += Convert.ToDateTime(gvliquidacion.Rows[i].Cells[1].Value).ToString("MM-dd-yyyy");
                xvalue += "|";
                xvalue += Convert.ToString(gvliquidacion.Rows[i].Cells[2].Value);
                xvalue += "|";
                xvalue += Convert.ToString(gvliquidacion.Rows[i].Cells[3].Value);
                xvalue += "|";
                xvalue += Convert.ToString(gvliquidacion.Rows[i].Cells[4].Value);
                xvalue += "|";
                xvalue += Convert.ToDecimal(gvliquidacion.Rows[i].Cells[5].Value);
                xvalue += "|";
                xvalue += Convert.ToString(gvliquidacion.Rows[i].Cells[6].Value);
                xvalue += "|";
                xvalue += Convert.ToString(gvliquidacion.Rows[i].Cells[7].Value);
                xvalue += "|";
                xvalue += Convert.ToDecimal(gvliquidacion.Rows[i].Cells[8].Value);
                if (i == count - 1) break;
                else xvalue += ";";
            }
            AccesoDatos daSQL = new AccesoDatos("con");
            string rpt = daSQL.ejecutarComando("uspEditarLQFD", "@ListaOrden", xvalue);
            if (string.IsNullOrEmpty(rpt))
            {
                men.ErrorGuardado();
            }
            else
            {
                txtAcuentaL.Enabled = false;
                btnActivarB.Enabled = true;
                btnGuardarB.Enabled = false;
                gvliquidacion.ReadOnly = true;
                txtAcuentaL.Text = "";
                listaLQ();
                men.GuardoCorrecto();
                listar();
            }
        }
        public void guardarLQ()
        {
            bool xEscorrecto = false;
            string xFechaRe = string.Empty;
            string xFormaPago = string.Empty;
            string xMoneda = string.Empty;
            string xTipoCambio = string.Empty;
            string xEntidadBancaria = string.Empty;
            string xNroOperacion = string.Empty;
            decimal xImporteL = 0;
            if (gvliquidacion.Rows.Count <= 0)
            {
                men.datosVacios();
            }
            else if (decimal.Parse(lblTotalDolarLQ.Text) <= 0 && decimal.Parse(lbltotalSol.Text) <= 0)
            {
                MessageBox.Show("No Ingreo ni un monto favor de verificar", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                gvliquidacion.Focus();
            }
            else
            {
                if (validarEmitidosG() == true)
                {
                    if (gvliquidacion.BeginEdit(true))
                    {
                        if (calculaAcuentaLQ_B() == true)
                        {
                            MessageBox.Show("EL MONTO QUE INGRESO, SUPERA EL SALDO ACTUAL...POR FAVOR VERIFIQUE SUS LIQUIDACIONES.", "ACUENTA", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                            gvliquidacion.CurrentRow.Cells[5].Value = "0.00";
                        }
                        calculaTotalLQ();
                        gvliquidacion.BeginEdit(false);
                    }
                    CultureInfo es = new CultureInfo("en-US");
                    DateTime dateValue;
                    foreach (DataGridViewRow row in gvliquidacion.Rows)
                    {
                        xFechaRe = Convert.ToString(row.Cells[1].Value);

                        if (!DateTime.TryParseExact(xFechaRe, "dd/MM/yyyy", es, DateTimeStyles.None, out dateValue))
                        {
                            MessageBox.Show("Formato de Fecha Incorrecto", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                            xEscorrecto = false;
                            break;
                        }
                        xFormaPago = Convert.ToString(row.Cells[2].Value);
                        xMoneda = Convert.ToString(row.Cells[3].Value);
                        xTipoCambio = Convert.ToString(row.Cells[3].Value);
                        xImporteL = Convert.ToDecimal(row.Cells[5].Value);
                        xEntidadBancaria = Convert.ToString(row.Cells[6].Value);
                        xNroOperacion = Convert.ToString(row.Cells[7].Value);
                        //xAcuentaG = Convert.ToDecimal(row.Cells[8].Value);
                        if (xFechaRe.Length == 0 || xFechaRe.Length < 10 || xFechaRe.Length > 10)
                        {
                            MessageBox.Show("INGRESE CORRECTAMENTE LA FECHA DE RECIBO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                            xEscorrecto = false;
                            break;
                        }
                        else if (xTipoCambio.Length == 0)
                        {
                            MessageBox.Show("INGRESE UN TIPO DE CAMBIO", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                            xEscorrecto = false;
                            break;
                        }
                        else if (xImporteL <= 0)
                        {
                            MessageBox.Show("EN UNA LIQUIDACION, EL IMPORTE SE ENCUENTRA EN CERO...", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                            xEscorrecto = false;
                            break;
                        }
                        else
                        {
                            if (xFormaPago.Contains("DEPOSITO"))
                            {
                                if (xEntidadBancaria.Length == 0 || xEntidadBancaria.Equals("-"))
                                {
                                    MessageBox.Show("En una liquidacion de pago, se realizo un Deposito, por favor " +
                                        "ingresar la (Entidad Bancaria y Numero Operacion)", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                                    xEscorrecto = false;
                                    break;
                                }
                                else if (xNroOperacion.Length == 0)
                                {
                                    MessageBox.Show("En una liquidacion de pago, se realizo un Deposito, por favor " +
                                        "ingresar la (Entidad Bancaria y Numero Operacion)", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                                    xEscorrecto = false;
                                    break;
                                }
                                else
                                {
                                    xEscorrecto = true;
                                }
                            }
                            else
                            {
                                xEscorrecto = true;
                            }
                        }
                    }
                    if (xEscorrecto == true)
                    {
                        editarLQ();
                    }
                }
                else
                {
                    MessageBox.Show("NO SE ENCONTRARON LIQUIDACIONES PARA GUARDAR, POR FAVOR AGREGAR NUEVO IMPORTE", "AVISO", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                }
            }
        }
        private void btnGuardarB_Click(object sender, EventArgs e)
        {
            guardarLQ();
        }

        private void chkNumero_CheckedChanged(object sender, EventArgs e)
        {
            if (chkNumero.Checked == true)
            {
                cmdfiltrar.Text = "Numero";
                txtbuscar.Text = "";
                cmdfiltrar.Enabled = false;
                gp_fecha.Enabled = false;
                txtbuscar.Focus();
            }
            else
            {
                cmdfiltrar.Text = "Auxiliar";
                txtbuscar.Text = "";
                cmdfiltrar.Enabled = true;
                gp_fecha.Enabled = true;
                listar();
                txtbuscar.Focus();
            }
        }
        FrmAuxiliar xauxiliar;
        private void btnCanalVenta_Click(object sender, EventArgs e)
        {
            xauxiliar = new FrmAuxiliar();
            xauxiliar.ShowDialog();
            if(xauxiliar.xAviso==1) traerServiciosB(xauxiliar.xNomAuxi);
        }

        private void cmdActividades_SelectedIndexChanged(object sender, EventArgs e)
        {

        }

        private void gvliquidacion_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }

        private void groupBox1_Enter(object sender, EventArgs e)
        {

        }
    }
}
