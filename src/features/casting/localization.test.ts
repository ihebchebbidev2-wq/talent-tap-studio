import { describe, expect, it } from 'vitest';
import { translate } from './localization';

describe('French and Arabic casting translations', () => {
  it('shows French form labels and validation messages', () => {
    expect(translate('fr', 'الاسم واللقب')).toBe('Nom et prénom');
    expect(translate('fr', 'اختار الفئة العمرية')).toBe('Sélectionnez votre tranche d’âge.');
    expect(translate('fr', 'حذف الصورة')).toBe('Supprimer la photo');
  });
  it('preserves Tunisian Arabic labels', () => {
    expect(translate('ar', 'إرسال الترشّح')).toBe('إرسال الترشّح');
  });
  it('keeps neutral values and gives a French validation fallback', () => {
    expect(translate('fr', 'https://')).toBe('https://');
    expect(translate('fr', 'غير موجود')).toBe('Veuillez vérifier ce champ.');
  });
});
