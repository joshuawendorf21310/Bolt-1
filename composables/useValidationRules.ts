export const useValidationRules = () => {
  const { supabase } = useApi();

  const createRule = async (rule: {
    name: string;
    description?: string;
    ruleType: string;
    fieldName: string;
    epcrType?: string;
    conditionExpression?: any;
    validationExpression: string;
    errorMessage: string;
    priority?: number;
  }, organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('validation_rules')
        .insert([{
          organization_id: organizationId,
          name: rule.name,
          description: rule.description,
          rule_type: rule.ruleType,
          field_name: rule.fieldName,
          epcr_type: rule.epcrType || 'all',
          condition_expression: rule.conditionExpression,
          validation_expression: rule.validationExpression,
          error_message: rule.errorMessage,
          priority: rule.priority || 100,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, rule: data };
    } catch (error) {
      console.error('Error creating validation rule:', error);
      return { success: false, error };
    }
  };

  const createRuleFromPrompt = async (prompt: string, organizationId: string) => {
    try {
      const response = await $fetch('/api/validation/generate-rule', {
        method: 'POST',
        body: { prompt, organizationId }
      });

      if (response.rule) {
        return await createRule(response.rule, organizationId);
      }

      return { success: false, error: 'Failed to generate rule' };
    } catch (error) {
      console.error('Error generating rule from prompt:', error);
      return { success: false, error };
    }
  };

  const validateIncident = async (incidentId: string, epcrType: string, organizationId: string) => {
    try {
      const { data: incident } = await supabase
        .from('incidents')
        .select(`
          *,
          patients (*),
          transport_data (*),
          patient_vitals (*),
          procedures (*)
        `)
        .eq('id', incidentId)
        .single();

      const { data: rules } = await supabase
        .from('validation_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .or(`epcr_type.eq.${epcrType},epcr_type.eq.all`)
        .order('priority', { ascending: true });

      const { data: stateRules } = await supabase
        .from('state_requirements')
        .select('*')
        .eq('state_code', incident.scene_state || 'CA')
        .or(`epcr_type.eq.${epcrType},epcr_type.is.null`);

      const errors: any[] = [];
      const warnings: any[] = [];

      rules?.forEach((rule: any) => {
        const result = evaluateRule(rule, incident);
        if (!result.valid) {
          if (rule.rule_type === 'required' || rule.rule_type === 'state_required') {
            errors.push({
              field: rule.field_name,
              message: rule.error_message,
              rule: rule.name
            });
          } else {
            warnings.push({
              field: rule.field_name,
              message: rule.error_message,
              rule: rule.name
            });
          }
        }
      });

      stateRules?.forEach((rule: any) => {
        if (rule.is_required) {
          const fieldValue = getNestedValue(incident, rule.field_name);
          if (!fieldValue || fieldValue === '') {
            errors.push({
              field: rule.field_name,
              message: `${rule.field_name} is required by ${rule.state_code} state`,
              rule: 'state_requirement'
            });
          }
        }
      });

      const isValid = errors.length === 0;

      await supabase
        .from('incidents')
        .update({
          validation_errors: errors,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      return {
        success: true,
        isValid,
        errors,
        warnings,
        errorCount: errors.length,
        warningCount: warnings.length
      };
    } catch (error) {
      console.error('Error validating incident:', error);
      return { success: false, error };
    }
  };

  const evaluateRule = (rule: any, incident: any) => {
    try {
      if (rule.condition_expression && !evaluateCondition(rule.condition_expression, incident)) {
        return { valid: true };
      }

      const fieldValue = getNestedValue(incident, rule.field_name);

      switch (rule.rule_type) {
        case 'required':
          return { valid: !!fieldValue && fieldValue !== '' };

        case 'format':
          const regex = new RegExp(rule.validation_expression);
          return { valid: regex.test(fieldValue) };

        case 'range':
          const [min, max] = rule.validation_expression.split(',').map(Number);
          return { valid: fieldValue >= min && fieldValue <= max };

        case 'conditional':
          return { valid: evaluateExpression(rule.validation_expression, incident) };

        default:
          return { valid: true };
      }
    } catch (error) {
      console.error('Error evaluating rule:', error);
      return { valid: false };
    }
  };

  const evaluateCondition = (condition: any, data: any) => {
    const fieldValue = getNestedValue(data, condition.field);
    const condValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condValue;
      case 'not_equals':
        return fieldValue !== condValue;
      case 'contains':
        return String(fieldValue).includes(condValue);
      case 'greater_than':
        return Number(fieldValue) > Number(condValue);
      case 'less_than':
        return Number(fieldValue) < Number(condValue);
      default:
        return true;
    }
  };

  const evaluateExpression = (expression: string, data: any) => {
    try {
      const safeExpression = expression.replace(/[^a-zA-Z0-9_.()&|!=<> ]/g, '');
      const func = new Function('data', `
        const getNestedValue = (obj, path) => {
          return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };
        return ${safeExpression};
      `);
      return func(data);
    } catch (error) {
      console.error('Error evaluating expression:', error);
      return false;
    }
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const createVisibilityRule = async (rule: {
    name: string;
    fieldName: string;
    epcrType?: string;
    showWhenExpression: any;
  }, organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('visibility_rules')
        .insert([{
          organization_id: organizationId,
          ...rule,
          epcr_type: rule.epcrType || 'all',
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, rule: data };
    } catch (error) {
      console.error('Error creating visibility rule:', error);
      return { success: false, error };
    }
  };

  const getVisibleFields = async (epcrType: string, currentData: any, organizationId: string) => {
    try {
      const { data: rules } = await supabase
        .from('visibility_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .or(`epcr_type.eq.${epcrType},epcr_type.eq.all`);

      const visibleFields = new Set<string>();

      rules?.forEach((rule: any) => {
        const shouldShow = evaluateCondition(rule.show_when_expression, currentData);
        if (shouldShow) {
          visibleFields.add(rule.field_name);
        }
      });

      return { success: true, visibleFields: Array.from(visibleFields) };
    } catch (error) {
      console.error('Error getting visible fields:', error);
      return { success: false, error };
    }
  };

  return {
    createRule,
    createRuleFromPrompt,
    validateIncident,
    createVisibilityRule,
    getVisibleFields,
    evaluateRule
  };
};
