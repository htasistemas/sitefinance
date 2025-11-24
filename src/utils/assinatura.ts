import { addMonths } from './date';

export function calcularDataFim(tipoPlano: string, dataInicio: Date): Date {
  switch (tipoPlano) {
    case 'mensal':
      return addMonths(dataInicio, 1);
    case 'semestral':
      return addMonths(dataInicio, 6);
    case 'anual':
      return addMonths(dataInicio, 12);
    default:
      return dataInicio;
  }
}
