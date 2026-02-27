
/* =========================================================
    LIMPIEZA ORDENADA
   ========================================================= */
IF OBJECT_ID('dbo.UsuarioSubModuloPermiso', 'U') IS NOT NULL DROP TABLE dbo.UsuarioSubModuloPermiso;
IF OBJECT_ID('dbo.AreaSubModuloPermiso', 'U') IS NOT NULL DROP TABLE dbo.AreaSubModuloPermiso;
IF OBJECT_ID('dbo.UsuarioModuloPermiso', 'U') IS NOT NULL DROP TABLE dbo.UsuarioModuloPermiso;
IF OBJECT_ID('dbo.AreaModuloPermiso', 'U') IS NOT NULL DROP TABLE dbo.AreaModuloPermiso;
IF OBJECT_ID('dbo.SubModulos', 'U') IS NOT NULL DROP TABLE dbo.SubModulos;
IF OBJECT_ID('dbo.Modulos', 'U') IS NOT NULL DROP TABLE dbo.Modulos;
GO

/* =========================================================
    CATALOGO MODULOS
   ========================================================= */
CREATE TABLE dbo.Modulos (
    IdModulo        INT IDENTITY(1,1) NOT NULL,
    Modulo          VARCHAR(80) NOT NULL,
    ModuloCode      VARCHAR(50) NOT NULL,
    FrontKey        VARCHAR(120) NULL,
    Activo          BIT NOT NULL CONSTRAINT DF_Modulos_Activo DEFAULT (1),
    Orden           INT NOT NULL CONSTRAINT DF_Modulos_Orden DEFAULT (0),
    FechaRegistro   DATETIME2(0) NOT NULL CONSTRAINT DF_Modulos_FechaRegistro DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Modulos PRIMARY KEY (IdModulo),
    CONSTRAINT UQ_Modulos_ModuloCode UNIQUE (ModuloCode),
    CONSTRAINT UQ_Modulos_Modulo UNIQUE (Modulo)
);
GO

/* =========================================================
    CATALOGO SUBMODULOS
   ========================================================= */
CREATE TABLE dbo.SubModulos (
    IdSubModulo     INT IDENTITY(1,1) NOT NULL,
    IdModulo        INT NOT NULL,
    SubModulo       VARCHAR(80) NOT NULL,
    SubModuloCode   VARCHAR(100) NOT NULL,
    FrontKey        VARCHAR(150) NULL,
    Activo          BIT NOT NULL CONSTRAINT DF_SubModulos_Activo DEFAULT (1),
    Orden           INT NOT NULL CONSTRAINT DF_SubModulos_Orden DEFAULT (0),
    FechaRegistro   DATETIME2(0) NOT NULL CONSTRAINT DF_SubModulos_FechaRegistro DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_SubModulos PRIMARY KEY (IdSubModulo),
    CONSTRAINT FK_SubModulos_Modulos FOREIGN KEY (IdModulo) REFERENCES dbo.Modulos(IdModulo),
    CONSTRAINT UQ_SubModulos_ModuloCode UNIQUE (IdModulo, SubModuloCode),
    CONSTRAINT UQ_SubModulos_ModuloNombre UNIQUE (IdModulo, SubModulo)
);
GO

CREATE INDEX IX_SubModulos_IdModulo ON dbo.SubModulos(IdModulo);
GO

/* =========================================================
    PERMISO BASE POR AREA (MODULO)
   ========================================================= */
CREATE TABLE dbo.AreaModuloPermiso (
  IdAreaModuloPermiso INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  AreaId NUMERIC(20,0) NOT NULL,
  IdModulo INT NOT NULL,
  [Allow] BIT NOT NULL,
  Activo BIT NOT NULL CONSTRAINT DF_AreaModuloPermiso_Activo DEFAULT (1),
  FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_AreaModuloPermiso_FechaRegistro DEFAULT (SYSDATETIME()),
  CONSTRAINT UQ_AreaModulo UNIQUE (AreaId, IdModulo),
  CONSTRAINT FK_AreaModulo_Area FOREIGN KEY (AreaId) REFERENCES dbo.Area(AreaId),
  CONSTRAINT FK_AreaModulo_Modulo FOREIGN KEY (IdModulo) REFERENCES dbo.Modulos(IdModulo)
);
GO

CREATE INDEX IX_AreaModuloPermiso_Area_Activo
ON dbo.AreaModuloPermiso (AreaId, Activo, IdModulo);
GO

/* =========================================================
  OVERRIDE POR USUARIO (MODULO)
   ========================================================= */
CREATE TABLE dbo.UsuarioModuloPermiso (
  IdUsuarioModuloPermiso INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  UsuarioId INT NOT NULL,
  IdModulo INT NOT NULL,
  Effect VARCHAR(10) NOT NULL CHECK (Effect IN ('allow','deny')),
  Activo BIT NOT NULL CONSTRAINT DF_UsuarioModuloPermiso_Activo DEFAULT (1),
  FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_UsuarioModuloPermiso_FechaRegistro DEFAULT (SYSDATETIME()),
  CONSTRAINT UQ_UsuarioModulo UNIQUE (UsuarioId, IdModulo),
  CONSTRAINT FK_UsuarioModulo_Usuario FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuarios(UsuarioID),
  CONSTRAINT FK_UsuarioModulo_Modulo FOREIGN KEY (IdModulo) REFERENCES dbo.Modulos(IdModulo)
);
GO

CREATE INDEX IX_UsuarioModuloPermiso_Usuario_Activo
ON dbo.UsuarioModuloPermiso (UsuarioId, Activo, IdModulo);
GO

/* =========================================================
    PERMISO BASE POR AREA (SUBMODULO)
   ========================================================= */
CREATE TABLE dbo.AreaSubModuloPermiso (
  IdAreaSubModuloPermiso INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  AreaId NUMERIC(20,0) NOT NULL,
  IdSubModulo INT NOT NULL,
  [Allow] BIT NOT NULL,
  Activo BIT NOT NULL CONSTRAINT DF_AreaSubModuloPermiso_Activo DEFAULT (1),
  FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_AreaSubModuloPermiso_FechaRegistro DEFAULT (SYSDATETIME()),
  CONSTRAINT UQ_AreaSubModulo UNIQUE (AreaId, IdSubModulo),
  CONSTRAINT FK_AreaSubModulo_Area FOREIGN KEY (AreaId) REFERENCES dbo.Area(AreaId),
  CONSTRAINT FK_AreaSubModulo_SubModulo FOREIGN KEY (IdSubModulo) REFERENCES dbo.SubModulos(IdSubModulo)
);
GO

CREATE INDEX IX_AreaSubModuloPermiso_Area_Activo
ON dbo.AreaSubModuloPermiso (AreaId, Activo, IdSubModulo);
GO

/* =========================================================
  OVERRIDE POR USUARIO (SUBMODULO)
   ========================================================= */
CREATE TABLE dbo.UsuarioSubModuloPermiso (
  IdUsuarioSubModuloPermiso INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  UsuarioId INT NOT NULL,
  IdSubModulo INT NOT NULL,
  Effect VARCHAR(10) NOT NULL CHECK (Effect IN ('allow','deny')),
  Activo BIT NOT NULL CONSTRAINT DF_UsuarioSubModuloPermiso_Activo DEFAULT (1),
  FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_UsuarioSubModuloPermiso_FechaRegistro DEFAULT (SYSDATETIME()),
  CONSTRAINT UQ_UsuarioSubModulo UNIQUE (UsuarioId, IdSubModulo),
  CONSTRAINT FK_UsuarioSubModulo_Usuario FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuarios(UsuarioID),
  CONSTRAINT FK_UsuarioSubModulo_SubModulo FOREIGN KEY (IdSubModulo) REFERENCES dbo.SubModulos(IdSubModulo)
);
GO

CREATE INDEX IX_UsuarioSubModuloPermiso_Usuario_Activo
ON dbo.UsuarioSubModuloPermiso (UsuarioId, Activo, IdSubModulo);
GO

/* =========================================================
     SEED MODULOS
   ========================================================= */
INSERT INTO dbo.Modulos (Modulo, ModuloCode, FrontKey, Orden)
VALUES
('Full Day', 'fullday', '/fullday', 1),
('City Tour', 'citytour', '/citytour', 2),
('Paquete de Viaje', 'paquete_viaje', '/paquete-viaje', 3),
('Cash Flow', 'cashflow', '/cashflow', 4),
('Mantenimiento', 'maintenance', '/maintenance', 5),
('Seguridad', 'security', '/seguridad', 6),
('Programacion', 'programacion', '/fullday/programacion/liquidaciones', 7);
GO

/* =========================================================
   SEED SUBMODULOS (maintenance + botones full/city)
   ========================================================= */
;WITH SeedSub AS (
  SELECT * FROM (VALUES
    ('maintenance','Categorias','maintenance.categories','/maintenance/categories',1),
    ('maintenance','Productos','maintenance.products','/maintenance/products',2),
    ('maintenance','Actividades adicionales','maintenance.actividades','/maintenance/actividades',3),
    ('maintenance','Areas','maintenance.areas','/maintenance/areas',4),
    ('maintenance','Hoteles','maintenance.hotels','/maintenance/hotels',5),
    ('maintenance','Puntos de partida','maintenance.partidas','/maintenance/partidas',6),
    ('maintenance','Canal de venta','maintenance.sales_channel','/maintenance/salesChannel',7),
    ('maintenance','Empleados','maintenance.employees','/maintenance/employees',8),
    ('maintenance','Usuarios','maintenance.users','/maintenance/users',9),

    ('fullday','Boton Agregar Programacion','fullday.programacion_liquidaciones.btn_agregar','/fullday/programacion/liquidaciones',101),
    ('fullday','Boton Guardar Programacion','fullday.programacion_liquidaciones.btn_guardar','/fullday/programacion/liquidaciones',102),
    ('citytour','Boton Agregar Programacion','citytour.programacion_liquidaciones.btn_agregar','/citytour/programacion/liquidaciones',101),
    ('citytour','Boton Guardar Programacion','citytour.programacion_liquidaciones.btn_guardar','/citytour/programacion/liquidaciones',102)
  ) v(ModuloCode,SubModulo,SubModuloCode,FrontKey,Orden)
)
MERGE dbo.SubModulos AS t
USING (
  SELECT m.IdModulo, s.SubModulo, s.SubModuloCode, s.FrontKey, s.Orden
  FROM SeedSub s
  JOIN dbo.Modulos m ON m.ModuloCode = s.ModuloCode
) AS src
ON t.IdModulo = src.IdModulo
AND t.SubModuloCode = src.SubModuloCode
WHEN MATCHED THEN
  UPDATE SET
    t.SubModulo = src.SubModulo,
    t.FrontKey = src.FrontKey,
    t.Orden = src.Orden,
    t.Activo = 1
WHEN NOT MATCHED BY TARGET THEN
  INSERT (IdModulo, SubModulo, SubModuloCode, FrontKey, Orden, Activo)
  VALUES (src.IdModulo, src.SubModulo, src.SubModuloCode, src.FrontKey, src.Orden, 1);
GO

/* =========================================================
  AREA 6 -> TODO HABILITADO (modulos + submodulos)
   ========================================================= */
DECLARE @AreaIdAll NUMERIC(20,0) = 6;

MERGE dbo.AreaModuloPermiso AS t
USING (
  SELECT @AreaIdAll AS AreaId, m.IdModulo
  FROM dbo.Modulos m
  WHERE m.Activo = 1
) AS s
ON t.AreaId = s.AreaId
AND t.IdModulo = s.IdModulo
WHEN MATCHED THEN
  UPDATE SET t.[Allow] = 1, t.Activo = 1
WHEN NOT MATCHED BY TARGET THEN
  INSERT (AreaId, IdModulo, [Allow], Activo)
  VALUES (s.AreaId, s.IdModulo, 1, 1);

MERGE dbo.AreaSubModuloPermiso AS t
USING (
  SELECT @AreaIdAll AS AreaId, sm.IdSubModulo
  FROM dbo.SubModulos sm
  WHERE sm.Activo = 1
) AS s
ON t.AreaId = s.AreaId
AND t.IdSubModulo = s.IdSubModulo
WHEN MATCHED THEN
  UPDATE SET t.[Allow] = 1, t.Activo = 1
WHEN NOT MATCHED BY TARGET THEN
  INSERT (AreaId, IdSubModulo, [Allow], Activo)
  VALUES (s.AreaId, s.IdSubModulo, 1, 1);
GO

/* =========================================================
   AREA 9 -> PRUEBA: SOLO FDAY + PROGRAMACION (sin botones)
   ========================================================= */
DECLARE @AreaIdTest NUMERIC(20,0) = 9;

UPDATE dbo.AreaModuloPermiso
SET [Allow] = 0, Activo = 1
WHERE AreaId = @AreaIdTest;

MERGE dbo.AreaModuloPermiso AS t
USING (
  SELECT @AreaIdTest AS AreaId, m.IdModulo
  FROM dbo.Modulos m
  WHERE m.ModuloCode IN ('fullday', 'programacion')
) AS s
ON t.AreaId = s.AreaId
AND t.IdModulo = s.IdModulo
WHEN MATCHED THEN
  UPDATE SET t.[Allow] = 1, t.Activo = 1
WHEN NOT MATCHED BY TARGET THEN
  INSERT (AreaId, IdModulo, [Allow], Activo)
  VALUES (s.AreaId, s.IdModulo, 1, 1);

/* area 9 sin submodulos habilitados  */
UPDATE dbo.AreaSubModuloPermiso
SET [Allow] = 0, Activo = 1
WHERE AreaId = @AreaIdTest;
GO
