const { Customer, User, Event, CustomersBillingRecords } = require("../models");
const { formatDateIso, calculateAge } = require("../utils/dateUtils");
const { updateConsultationDays } = require("../utils/updateConsultationDays");


exports.upsertCustomer = async (userId, customerData) => {
  const {
    customer_id,
    customer_name,
    customer_cpf_cnpj,
    customer_phone,
    customer_email,
    consultation_fee,
    patient_status,
    alternative_name,
    alternative_cpf_cnpj,
    customer_dob,
  } = customerData;

  if (!customer_name || !customer_cpf_cnpj) {
    return {
      status: 400,
      error: "Nome e CPF/CNPJ do paciente são obrigatórios.",
    };
  }

  const documentPattern = /^(\d{11}|\d{14})$/;
  if (!documentPattern.test(customer_cpf_cnpj)) {
    return { status: 400, error: "CPF deve ter 11 dígitos e CNPJ 14." };
  }
  if (alternative_cpf_cnpj && !documentPattern.test(alternative_cpf_cnpj)) {
    return {
      status: 400,
      error: "CPF/CNPJ do recibo deve ter 11 ou 14 dígitos.",
    };
  }
  if (customer_phone && !/^\d{10,15}$/.test(customer_phone)) {
    return { status: 400, error: "Telefone deve ter entre 10 e 15 dígitos." };
  }

  const validPatientStatus =
    patient_status === "true"
      ? true
      : patient_status === "false"
      ? false
      : null;

  const formattedCustomerDob = formatDateIso(customer_dob);

  if (customer_id) {
    const customer = await Customer.findOne({
      where: { customer_id, user_id: userId },
    });
    if (!customer) {
      return { status: 404, error: "Paciente não encontrado." };
    }

    await customer.update({
      customer_name,
      customer_cpf_cnpj,
      customer_phone,
      customer_email,
      consultation_fee,
      patient_status: validPatientStatus,
      alternative_name,
      alternative_cpf_cnpj,
      customer_dob: formattedCustomerDob,
    });

    const billingRecord = await CustomersBillingRecords.findOne({
      where: { customer_id: customer.customer_id },
    });

    if (billingRecord) {
      await billingRecord.update({
        consultation_fee: parseFloat(consultation_fee) || 0.0,
      });
    } else {
      await CustomersBillingRecords.create({
        customer_id: customer.customer_id,
        month_and_year: null,
        consultation_fee: parseFloat(consultation_fee) || 0.0,
      });
    }

    const age = calculateAge(formattedCustomerDob);
    return { customer, age };
  } else {
    const newCustomer = await Customer.create({
      user_id: userId,
      customer_name,
      customer_cpf_cnpj,
      customer_phone,
      customer_email,
      patient_status: validPatientStatus,
      alternative_name,
      alternative_cpf_cnpj,
      customer_dob: formattedCustomerDob,
      archived: false,
      consultation_fee,
    });

    const age = calculateAge(formattedCustomerDob);
    return { newCustomer, age };
  }
};

const respondUpsert = async (res, successStatus, upsert) => {
  try {
    const result = await upsert();
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.status(successStatus).json(result);
  } catch (error) {
    console.error("Erro ao salvar paciente:", error);
    res.status(500).json({ error: "Erro ao salvar paciente." });
  }
};

exports.createCustomer = (req, res) =>
  respondUpsert(res, 201, () =>
    this.upsertCustomer(req.user.user_id, req.body)
  );

exports.editCustomer = (req, res) =>
  respondUpsert(res, 200, () =>
    this.upsertCustomer(req.user.user_id, {
      ...req.body,
      customer_id: req.params.customerId,
    })
  );

exports.getCustomers = async (req, res) => {
  const userId = req.user.user_id;

  if (!userId) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  const customers = await Customer.findAll({
    where: { user_id: req.user.user_id, archived: false },
    include: [
      {
        model: CustomersBillingRecords,
        attributes: ["consultation_days", "consultation_fee"],
        required: false,
      },
    ],
  });

  let totalConsultations = 0;
  let totalRevenue = 0;

  const customersWithConsultationDays = customers.map((customer) => {
    const customerData = customer.toJSON();

    const consultationDays =
      customerData.CustomersBillingRecords &&
      customerData.CustomersBillingRecords[0]?.consultation_days
        ? customerData.CustomersBillingRecords[0].consultation_days
            .split(", ")
            .map((day) => day.trim())
        : [];

    customerData.consultation_days = consultationDays.join(", ");
    customerData.num_consultations = consultationDays.length;

    const consultationFee = customerData.CustomersBillingRecords[0]
      ?.consultation_fee
      ? parseFloat(customerData.CustomersBillingRecords[0].consultation_fee)
      : 0;
    customerData.total_consultation_fee = (
      consultationFee * customerData.num_consultations
    ).toFixed(2);

    totalConsultations += customerData.num_consultations;
    totalRevenue += parseFloat(customerData.total_consultation_fee);

    return customerData;
  });

  res.json({
    customers: customersWithConsultationDays,
    totalConsultations,
    totalRevenue: parseFloat(totalRevenue).toFixed(2),
  });
};

exports.getProfileCustomer = async (req, res) => {
  const { customerId } = req.params;
  const userId = req.user.user_id;

  const customer = await Customer.findOne({
    where: { customer_id: customerId, user_id: userId },
  });

  if (!customer) {
    return res.status(404).json({ error: "Cliente não encontrado." });
  }

  const age = calculateAge(customer.customer_dob);

  return res.status(200).json({ ...customer.toJSON(), age });
};

exports.deleteCustomer = async (req, res, next) => {
  const { customerId } = req.params;
  const userId = req.user.user_id;

  const customer = await Customer.findOne({
    where: { customer_id: customerId, user_id: userId },
  });

  if (!customer) {
    return res
      .status(404)
      .json({ error: "Cliente não encontrado ou não autorizado." });
  }

  await Customer.destroy({ where: { customer_id: customerId } });

  res.status(200).json({ message: "Cliente deletado com sucesso." });
};

exports.archiveCustomer = async (req, res) => {
  const { customerId } = req.params;
  const userId = req.user.user_id;
  const { archived } = req.body;

  const customer = await Customer.findOne({
    where: { customer_id: customerId, user_id: userId },
  });

  if (!customer) {
    return res.status(404).json({ error: "Cliente não encontrado." });
  }

  await Customer.update(
    { archived: archived },
    { where: { customer_id: customerId, user_id: userId } }
  );

  res.status(200).json({ message: "Cliente arquivado com sucesso." });
};

exports.getArchivedCustomers = async (req, res) => {
  const userId = req.user.user_id;

  const archivedCustomer = await Customer.findAll({
    where: { user_id: userId, archived: true },
  });

  if (archivedCustomer) {
    return res.status(200).json(archivedCustomer);
  }
  res.status(500).send("Erro ao buscar pacientes arquivados.");
};

exports.linkCustomerToEvent = async (req, res) => {
  const { eventId, customer_id } = req.body;
  const userId = req.user.user_id;

  try {
    const event = await Event.findOne({
      where: { customers_id: eventId, user_id: userId },
    });

    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado." });
    }

    // 1. Vincula o paciente ao evento
    event.customer_id = customer_id;
    await event.save();

    // 2. O PULO DO GATO: Atualiza o faturamento/dias de consulta 
    // agora que o evento tem um dono oficial!
    if (typeof updateConsultationDays === "function") {
       await updateConsultationDays(customer_id);
    }

    res.status(200).json({ 
      message: "Paciente vinculado e faturamento atualizado com sucesso!" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao vincular paciente." });
  }
};
