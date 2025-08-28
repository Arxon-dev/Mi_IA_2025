import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/prisma-retry';
import { QuestionTableName } from '@/types/questionTables';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, sectionId } = body;

    console.log(`🧹 [API DELETE /questions/custom-table/clear] Archivando preguntas de tabla ${tableName} para sectionId ${sectionId}`);

    if (!tableName || !sectionId) {
      return NextResponse.json(
        { error: 'tableName y sectionId son requeridos' },
        { status: 400 }
      );
    }

    if (tableName === 'SectionQuestion') {
      return NextResponse.json(
        { error: 'Use el endpoint específico para SectionQuestion' },
        { status: 400 }
      );
    }

    // Mapear el nombre de la tabla a la tabla real de Prisma
    let updateResult;
    
    switch (tableName as QuestionTableName) {
      case 'Armada':
        updateResult = await withRetry(async () => {
          return await (prisma as any).armada.updateMany({
            where: {
              sectionid: sectionId,  // Cambiar sectionId a sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          });
        }, 3, `clearCustomTable-${tableName}(${sectionId})`);
        break;
      case 'Constitucion':
        updateResult = await withRetry(async () => {
          return await (prisma as any).constitucion.updateMany({
            where: {
              sectionid: sectionId,  // Cambiar sectionId a sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          });
        }, 3, `clearCustomTable-${tableName}(${sectionId})`);
        break;
      // En el switch, para cada caso:
      case 'DefensaNacional':
          updateResult = await withRetry(async () => {
              return await (prisma as any).defensanacional.updateMany({  // Cambiado a minúsculas
                  where: {
                    sectionid: sectionId,  // Cambiar sectionId a sectionid
                    isactive: true
                  },
                  data: {
                    isactive: false
                  }
                });
              }, 3, `clearCustomTable-${tableName}(${sectionId})`);
              break;
      // Aplica lo mismo para otros casos con mayúsculas, como 'SeguridadNacional' a 'seguridadnacional', etc.
      case 'Rio':
        updateResult = await withRetry(async () => {
          return await (prisma as any).rio.updateMany({
            where: {
              sectionid: sectionId,  // Cambiar sectionId a sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          });
        }, 3, `clearCustomTable-${tableName}(${sectionId})`);
        break;
      case 'Minsdef':
        updateResult = await withRetry(async () => {
          return await (prisma as any).minsdef.updateMany({
            where: {
              sectionid: sectionId,  // Cambiar sectionId a sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          });
        }, 3, `clearCustomTable-${tableName}(${sectionId})`);
        break;
      case 'OrganizacionFas':
        updateResult = await withRetry(async () => {
          return await (prisma as any).organizacionFas.updateMany({
            where: {
              sectionid: sectionId,  // Cambiar sectionId a sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          });
        }, 3, `clearCustomTable-${tableName}(${sectionId})`);
        break;
      case 'Emad':
        updateResult = await withRetry(async () => {
          return await (prisma as any).emad.updateMany({
            where: {
              sectionid: sectionId,  // Cambiar sectionId a sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          });
        }, 3, `clearCustomTable-${tableName}(${sectionId})`);
        break;
      case 'Et':
        updateResult = await (prisma as any).et.updateMany({
          where: {
            sectionId: sectionId,
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'Aire':
        updateResult = await withRetry(() => 
          (prisma as any).aire.updateMany({
            where: {
              sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          })
        );
        break;
      case 'Carrera':
        updateResult = await withRetry(() => 
          (prisma as any).carrera.updateMany({
            where: {
              sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          })
        );
        break;
      case 'Tropa':
        updateResult = await withRetry(() => 
          (prisma as any).tropa.updateMany({
            where: {
              sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          })
        );
        break;
      case 'Rroo':
        updateResult = await withRetry(() => 
          (prisma as any).rroo.updateMany({
            where: {
              sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
              isactive: true
            },
            data: {
              isactive: false
            }
          })
        );
        break;
      case 'DerechosYDeberes':
        updateResult = await (prisma as any).derechosydeberes.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'RegimenDisciplinario':
        updateResult = await (prisma as any).regimendisciplinario.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'IniciativasQuejas':
        updateResult = await (prisma as any).iniciativasquejas.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'Igualdad':
        updateResult = await (prisma as any).igualdad.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'Omi':
        updateResult = await (prisma as any).omi.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'Pac':
        updateResult = await (prisma as any).pac.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'SeguridadNacional':
        updateResult = await (prisma as any).seguridadnacional.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'Pdc':
        updateResult = await (prisma as any).pdc.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'Onu':
        updateResult = await (prisma as any).onu.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'Otan':
        updateResult = await (prisma as any).otan.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'Osce':
        updateResult = await (prisma as any).osce.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'Ue':
        updateResult = await (prisma as any).ue.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      case 'MisionesInternacionales':
        updateResult = await (prisma as any).misionesinternacionales.updateMany({
          where: {
            sectionid: sectionId, // 🔧 Corregido: sectionId → sectionid
            isactive: true
          },
          data: {
            isactive: false
          }
        });
        break;
      default:
        return NextResponse.json(
          { error: `Tabla personalizada no soportada: ${tableName}` },
          { status: 400 }
        );
    }

    console.log(`✅ [API DELETE /questions/custom-table/clear] Marcadas como inactivas ${updateResult.count} preguntas de ${tableName} (mantenidas en BD)`);

    return NextResponse.json({
      success: true,
      archivedCount: updateResult.count,
      message: `${updateResult.count} pregunta(s) anterior(es) archivada(s) en ${tableName} (mantenidas en BD para historial)`
    });

  } catch (error) {
    console.error(`❌ [API DELETE /questions/custom-table/clear] Error:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor al archivar preguntas de tabla personalizada' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}