//Importacion de librerias
import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, } from "recharts";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

//Declaracion de variables
const cantidadInicial = 5;
const precioProducto = 2.5;

//Funcion para calcular el stock faltante
function calculoVentas(stock) {
  return Math.max(0, cantidadInicial - stock);
}

//Funcion para formatear la hora
function formatoHora(timestamp) {
  if (!timestamp) return "--:--";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

//Funcion para mostar el nivel de productos
function estadoStock({ stock }) {
  const porcentaje = (stock / cantidadInicial) * 100;
  if (porcentaje == 0) return <span className="badge badge-danger">Agotado</span>;
  if (porcentaje <= 20) return <span className="badge badge-danger">Crítico</span>;
  if (porcentaje <= 60) return <span className="badge badge-warn">Bajo</span>;
  return <span className="badge badge-ok">Normal</span>;
}

//Funcion para mostar cuadro de detalles en la grafica
function tooltipGrafica({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="ct-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function App() {
  const [lecturas, setLecturas] = useState([]);

  //Mostrar ultimos 5 registros
  useEffect(() => {
    const q = query(
      collection(db, "jugosKerns"),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const cancelarEscuchar = onSnapshot(q, (resultado) => {
      const docs = resultado.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .reverse();

      setLecturas(docs);
    });

    return () => cancelarEscuchar();
  }, []);

  const ultimaLectura = lecturas[lecturas.length - 1];
  const stockActual = ultimaLectura ? ultimaLectura.stock : 0;
  const vendidos = ultimaLectura ? calculoVentas(ultimaLectura.stock) : 0;
  const pesoActual = ultimaLectura ? ultimaLectura.peso.toFixed(1) : "0";
  const porcentaje = Math.round((stockActual / cantidadInicial) * 100);
  const dineroGanado = vendidos * precioProducto;

  const datosGrafica = lecturas.map((lectura) => ({
    hora: formatoHora(lectura.timestamp),
    peso: parseFloat(lectura.peso.toFixed(1)),
    stock: lectura.stock,
    vendidos: calculoVentas(lectura.stock),
  }));

  const graficaCircular = [
    { name: "En stock", value: stockActual },
    { name: "Vendidos", value: vendidos },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        {/* Barra horizontal izquierda */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span>Tienda ICDERA</span>
        </div>

        {/* Opciones de la barra horizontal */}
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </button>
          <button className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Productos
          </button>
          <button className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Alertas
            {stockActual <= 3 && <span className="nav-badge" />}
          </button>
        </nav>

        {/* Texto inferior barra horizontal */}
        <div className="sidebar-footer">
          <div className="mqtt-status">
            <span className="mqtt-dot" />
            <div>
              <p className="mqtt-label">MQTT Activo</p>
              <p className="mqtt-sub">HiveMQ Cloud</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido dashboard */}
      <main className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">Inventario</h1>
          </div>
        </header>

        {/* Cuadros KPIs */}
        <div className="kpi-row">
          {/* Cuadro Stock actual */}
          <div className="kpi-card" style={{ "--accent": "#3B9EFF" }}>
            <div className="kpi-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
            <div>
              <p className="kpi-label">Stock actual</p>
              <p className="kpi-value">{stockActual} <span className="kpi-unit"></span></p>
              <p className="kpi-sub">de 5 jugos</p>
            </div>
          </div>

          {/* Cuadro Vendidos */}
          <div className="kpi-card" style={{ "--accent": "#10C98F" }}>
            <div className="kpi-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div>
              <p className="kpi-label">Vendidos</p>
              <p className="kpi-value">{vendidos} <span className="kpi-unit"></span></p>
              <p className="kpi-sub">jugos Kerns</p>
            </div>
          </div>

          {/* Cuadro Peso detectado */}
          <div className="kpi-card" style={{ "--accent": "#A78BFA" }}>
            <div className="kpi-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="kpi-label">Peso actual</p>
              <p className="kpi-value">{pesoActual} g<span className="kpi-unit"></span></p>
              <p className="kpi-sub">ultimo valor detectado</p>
            </div>
          </div>

          {/* Cuadro Ganado */}
          <div className="kpi-card" style={{ "--accent": "#F59E0B" }}>
            <div className="kpi-icon amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
              </svg>
            </div>
            <div>
              <p className="kpi-label">Ganado</p>
              <p className="kpi-value">Q {dineroGanado} <span className="kpi-unit"></span></p>
              <p className="kpi-sub">en ventas totales</p>
            </div>
          </div>
        </div>

        {/* Graficas */}
        <div className="content-grid">
          {/* Grafica de lineas */}
          <div className="charts-col">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Ventas del dia</h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={datosGrafica} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B9EFF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B9EFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="hora" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} unit="g" />
                  <Tooltip content={<tooltipGrafica />} />
                  <Area type="monotone" dataKey="peso" name="Peso (g)" stroke="#3B9EFF" strokeWidth={2} fill="url(#gradPeso)" dot={{ r: 3, fill: "#3B9EFF" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafica de barras */}
          <div className="product-panel">
            <div className="product-header">
              <div className="product-icon">🧃</div>
              <div>
                <h2 className="product-name">Jugos Kerns</h2>
              </div>
              <estadoStock stock={stockActual} />
            </div>

            <div className="progress-section">
              <div className="progress-labels">
                <span>Stock disponible</span>
                <span className="progress-porcentaje">{porcentaje}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${porcentaje}%`,
                    background: porcentaje <= 15 ? "#EF4444" : porcentaje <= 35 ? "#F97316" : "#3B9EFF",
                  }}
                />
              </div>
              <div className="progress-labels" style={{ marginTop: 6 }}>
                <span className="muted">{stockActual} jugos restantes</span>
                <span className="muted">5 en total</span>
              </div>
            </div>

            {/* Grafica de anillo */}
            <div className="donut-section">
              <p className="chart-sub-title">Distribución</p>
              <div className="donut-wrap">
                <PieChart width={140} height={140}>
                  <Pie data={graficaCircular

                  } cx={65} cy={65} innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                    <Cell fill="#3B9EFF" />
                    <Cell fill="#E8EEF4" />
                  </Pie>
                </PieChart>
                <div className="donut-legend">
                  {graficaCircular
                    .map((d, i) => (
                      <div key={d.name} className="dl-row">
                        <span className="dl-dot" style={{ background: i === 0 ? "#3B9EFF" : "#E8EEF4" }} />
                        <span className="dl-name">{d.name}</span>
                        <span className="dl-val">{d.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Ultima lectura */}
            <div className="last-reading">
              <span className="lr-dot" />
              <span className="lr-text">
                Última lectura: <strong>{ultimaLectura ? formatoHora(ultimaLectura.timestamp) : "--"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de datos */}
        <div className="table-card">
          <h2 className="section-title">Historial de lecturas</h2>
          <div className="table-wrap">
            <table className="readings-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Producto</th>
                  <th>Peso (g)</th>
                  <th>Stock</th>
                  <th>Vendidos</th>
                  <th>Cambio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {[...lecturas].reverse().map((lectura, i, arr) => {
                  const prev = arr[i + 1];
                  const stockAct = lectura.stock;
                  const stockPrev = prev ? prev.stock : stockAct;
                  const delta = stockAct - stockPrev;
                  return (
                    <tr key={lectura.id}>
                      <td className="td-mono">{formatoHora(lectura.timestamp)}</td>
                      <td>{lectura.producto}</td>
                      <td>{lectura.peso?.toFixed(1)}g</td>
                      <td><strong>{stockAct}</strong></td>
                      <td>{calculoVentas(lectura.stock)}</td>
                      <td>
                        {delta !== 0 && (
                          <span className={`delta ${delta < 0 ? "delta-neg" : "delta-pos"}`}>
                            {delta > 0 ? "+" : ""}{delta}
                          </span>
                        )}
                      </td>
                      <td><estadoStock stock={stockAct} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}