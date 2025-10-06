import React, { useEffect, useState, useContext } from 'react';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Invoices = () => {
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientTreatments, setPatientTreatments] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceForm, setInvoiceForm] = useState({
    patient_id: '',
    doctor_name: user?.full_name || '',
    invoice_date: new Date().toISOString().split('T')[0],
    governorate_id: '',
    area_id: '',
    payment_method: 'cash',
    items: [{ service: '', quantity: 1, unit_price: '', notes: '' }],
    discount: 0,
    extra_fees: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    try {
      const [paymentsData, patientsData, governoratesData] = await Promise.all([
        api.getPayments(filterStatus !== 'all' ? { status: filterStatus } : {}),
        api.getPatients(),
        fetch('/api/locations/governorates').then(res => res.json())
      ]);
      
      setInvoices(paymentsData.map(p => ({
        ...p,
        invoice_no: `INV-${String(p.id).padStart(5, '0')}`
      })));
      setPatients(patientsData);
      setGovernorates(governoratesData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAreas = async (governorateId) => {
    try {
      const response = await fetch(`/api/locations/areas/${governorateId}`);
      const data = await response.json();
      setAreas(data);
    } catch (error) {
      console.error('خطأ في تحميل المناطق:', error);
    }
  };

  const handleGovernorateChange = (governorateId) => {
    setInvoiceForm({...invoiceForm, governorate_id: governorateId, area_id: ''});
    if (governorateId) {
      loadAreas(governorateId);
    } else {
      setAreas([]);
    }
  };

  const loadPatientTreatments = async (patientId) => {
    try {
      const treatments = await api.getTreatments({ patient_id: patientId });
      const completedTreatments = treatments.filter(t => t.status === 'completed');
      setPatientTreatments(completedTreatments);
      
      if (completedTreatments.length > 0) {
        const treatmentItems = completedTreatments.map(treatment => ({
          service: treatment.procedure_done || treatment.diagnosis,
          quantity: 1,
          unit_price: parseFloat(treatment.cost || 0),
          notes: treatment.tooth_number ? `رقم السن: ${treatment.tooth_number}` : '',
          treatment_id: treatment.id
        }));
        
        setInvoiceForm({
          ...invoiceForm,
          patient_id: patientId,
          items: treatmentItems
        });
      } else {
        setInvoiceForm({
          ...invoiceForm,
          patient_id: patientId,
          items: [{ service: '', quantity: 1, unit_price: '', notes: '' }]
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل علاجات المريض:', error);
      setPatientTreatments([]);
    }
  };

  const handlePatientChange = (patientId) => {
    if (patientId) {
      loadPatientTreatments(patientId);
    } else {
      setInvoiceForm({
        ...invoiceForm,
        patient_id: '',
        items: [{ service: '', quantity: 1, unit_price: '', notes: '' }],
        payment_method: 'cash'
      });
      setPatientTreatments([]);
    }
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { service: '', quantity: 1, unit_price: '', notes: '' }]
    });
  };

  const removeInvoiceItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({...invoiceForm, items: newItems});
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    setInvoiceForm({...invoiceForm, items: newItems});
  };

  const calculateSubtotal = () => {
    return invoiceForm.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(invoiceForm.discount || 0);
    const extraFees = parseFloat(invoiceForm.extra_fees || 0);
    return subtotal - discount + extraFees;
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    try {
      const patient = patients.find(p => p.id === parseInt(invoiceForm.patient_id));
      const governorate = governorates.find(g => g.id === parseInt(invoiceForm.governorate_id));
      const area = areas.find(a => a.id === parseInt(invoiceForm.area_id));
      
      const invoiceData = {
        patient_id: invoiceForm.patient_id,
        amount: calculateTotal(),
        payment_date: invoiceForm.invoice_date,
        payment_method: invoiceForm.payment_method,
        status: 'pending',
        notes: JSON.stringify({
          doctor_name: invoiceForm.doctor_name,
          governorate: governorate?.name_ar || '',
          area: area?.name_ar || '',
          items: invoiceForm.items.filter(item => item.service && item.unit_price),
          discount: invoiceForm.discount,
          extra_fees: invoiceForm.extra_fees,
          invoice_notes: invoiceForm.notes
        })
      };

      if (currentInvoice) {
        await api.updatePayment(currentInvoice.id, invoiceData);
      } else {
        await api.createPayment(invoiceData);
      }
      
      setShowInvoiceModal(false);
      resetForm();
      loadData();
      alert(currentInvoice ? 'تم تحديث الفاتورة بنجاح' : 'تم إنشاء الفاتورة بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ الفاتورة:', error);
      alert('فشل في حفظ الفاتورة');
    }
  };

  const resetForm = () => {
    setInvoiceForm({
      patient_id: '',
      doctor_name: user?.full_name || '',
      invoice_date: new Date().toISOString().split('T')[0],
      governorate_id: '',
      area_id: '',
      payment_method: 'cash',
      items: [{ service: '', quantity: 1, unit_price: '', notes: '' }],
      discount: 0,
      extra_fees: 0,
      notes: ''
    });
    setCurrentInvoice(null);
    setAreas([]);
    setPatientTreatments([]);
  };

  const printInvoice = (invoice) => {
    let invoiceData = {};
    try {
      invoiceData = invoice.notes ? JSON.parse(invoice.notes) : {};
    } catch (e) {
      invoiceData = {};
    }
    const items = invoiceData.items || [];
    const patient = patients.find(p => p.id === invoice.patient_id);
    
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة - ${invoice.invoice_no}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            direction: rtl;
            background: white;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #10B981;
            padding: 30px;
            border-radius: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #10B981;
          }
          .header h1 {
            color: #10B981;
            font-size: 32px;
            margin-bottom: 10px;
          }
          .header .clinic-info {
            color: #64748B;
            font-size: 14px;
            margin: 5px 0;
          }
          .invoice-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background: #F8FAFC;
            border-radius: 8px;
          }
          .invoice-meta .section {
            padding: 10px;
          }
          .invoice-meta h3 {
            color: #334155;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .invoice-meta p {
            color: #64748B;
            margin: 5px 0;
            font-size: 15px;
          }
          .invoice-meta strong {
            color: #1E293B;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th {
            background: #10B981;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #E2E8F0;
            text-align: center;
            font-size: 15px;
          }
          .items-table tr:last-child td {
            border-bottom: none;
          }
          .items-table tr:hover {
            background: #F8FAFC;
          }
          .totals {
            margin: 30px 0;
            padding: 20px;
            background: #F8FAFC;
            border-radius: 8px;
          }
          .totals .row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 16px;
          }
          .totals .row.total {
            border-top: 2px solid #10B981;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 24px;
            font-weight: bold;
            color: #10B981;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E2E8F0;
            text-align: center;
            color: #64748B;
            font-size: 13px;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            margin: 40px 0 20px 0;
          }
          .signature-box {
            text-align: center;
            padding: 20px;
          }
          .signature-line {
            border-top: 2px solid #CBD5E1;
            margin: 40px 20px 10px 20px;
          }
          @media print {
            body { padding: 20px; }
            .invoice-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>🦷 عيادة الأسنان الحديثة</h1>
            <p class="clinic-info">نظام إدارة متطور لعيادات الأسنان</p>
            <p class="clinic-info">الكويت - ${invoiceData.governorate || 'محافظة حولي'} - ${invoiceData.area || 'السالمية'}</p>
            <p class="clinic-info">هاتف: 22253390+ | جوال: 96551234567+</p>
          </div>

          <div class="invoice-meta">
            <div class="section">
              <h3>معلومات الفاتورة</h3>
              <p><strong>رقم الفاتورة:</strong> ${invoice.invoice_no}</p>
              <p><strong>التاريخ:</strong> ${new Date(invoice.payment_date).toLocaleDateString('ar-KW')}</p>
              <p><strong>الطبيب:</strong> ${invoiceData.doctor_name || user?.full_name || 'غير محدد'}</p>
            </div>
            <div class="section">
              <h3>معلومات المريض</h3>
              <p><strong>الاسم:</strong> ${patient?.full_name || 'غير محدد'}</p>
              <p><strong>الرقم المدني:</strong> ${patient?.national_id || 'غير محدد'}</p>
              <p><strong>رقم الملف:</strong> #${invoice.patient_id}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الخدمة / العلاج</th>
                <th>الكمية</th>
                <th>السعر للوحدة (د.ك)</th>
                <th>الإجمالي (د.ك)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.service}</td>
                  <td>${item.quantity}</td>
                  <td>${parseFloat(item.unit_price).toFixed(3)}</td>
                  <td>${(parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(3)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="row">
              <span>المجموع الفرعي:</span>
              <span>${(parseFloat(invoice.amount) + parseFloat(invoiceData.discount || 0) - parseFloat(invoiceData.extra_fees || 0)).toFixed(3)} د.ك</span>
            </div>
            ${invoiceData.discount > 0 ? `
              <div class="row" style="color: #EF4444;">
                <span>الخصم:</span>
                <span>- ${parseFloat(invoiceData.discount).toFixed(3)} د.ك</span>
              </div>
            ` : ''}
            ${invoiceData.extra_fees > 0 ? `
              <div class="row">
                <span>رسوم إضافية:</span>
                <span>+ ${parseFloat(invoiceData.extra_fees).toFixed(3)} د.ك</span>
              </div>
            ` : ''}
            <div class="row total">
              <span>الإجمالي النهائي:</span>
              <span>${parseFloat(invoice.amount).toFixed(3)} د.ك</span>
            </div>
          </div>

          ${invoiceData.invoice_notes ? `
            <div style="padding: 15px; background: #FEF3C7; border-radius: 8px; margin: 20px 0;">
              <strong style="color: #92400E;">ملاحظات:</strong>
              <p style="color: #78350F; margin-top: 5px;">${invoiceData.invoice_notes}</p>
            </div>
          ` : ''}

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p style="font-weight: 600; color: #475569;">توقيع المريض</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p style="font-weight: 600; color: #475569;">توقيع المحاسب/الطبيب</p>
            </div>
          </div>

          <div class="footer">
            <p><strong>ملاحظة:</strong> جميع الأسعار بالدينار الكويتي (KWD) - لا تشمل أي ضريبة</p>
            <p style="margin-top: 10px;">شكراً لزيارتكم - نتمنى لكم دوام الصحة والعافية</p>
            <p style="margin-top: 5px; font-size: 12px;">تم الطباعة: ${new Date().toLocaleString('ar-KW')}</p>
          </div>
        </div>
        <script>
          window.onload = () => window.print();
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      invoice.invoice_no.toLowerCase().includes(search) ||
      (invoice.patient_name && invoice.patient_name.toLowerCase().includes(search)) ||
      (invoice.id && invoice.id.toString().includes(search))
    );
  });

  const canManageInvoices = user.role === 'reception' || user.role === 'admin';

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📋 إدارة الفواتير</h1>
          <p style={styles.subtitle}>نظام الفواتير الاحترافي - الدينار الكويتي (KWD)</p>
        </div>
        {canManageInvoices && (
          <button onClick={() => { resetForm(); setShowInvoiceModal(true); }} style={styles.addButton}>
            ➕ إنشاء فاتورة جديدة
          </button>
        )}
      </div>

      <div style={styles.statsSection}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <h3 style={styles.statValue}>
            {invoices.filter(i => i.status === 'completed')
              .reduce((sum, i) => sum + parseFloat(i.amount), 0).toFixed(3)} د.ك
          </h3>
          <p style={styles.statLabel}>إجمالي الفواتير المدفوعة</p>
        </div>
        <div style={{...styles.statCard, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'}}>
          <div style={styles.statIcon}>⏳</div>
          <h3 style={styles.statValue}>
            {invoices.filter(i => i.status === 'pending')
              .reduce((sum, i) => sum + parseFloat(i.amount), 0).toFixed(3)} د.ك
          </h3>
          <p style={styles.statLabel}>الفواتير المعلقة</p>
        </div>
        <div style={{...styles.statCard, background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'}}>
          <div style={styles.statIcon}>📊</div>
          <h3 style={styles.statValue}>{invoices.length}</h3>
          <p style={styles.statLabel}>إجمالي الفواتير</p>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <input 
            type="text" 
            placeholder="🔍 البحث برقم الفاتورة أو اسم المريض..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filters}>
          <button 
            onClick={() => setFilterStatus('all')} 
            style={filterStatus === 'all' ? styles.activeFilter : styles.filterBtn}
          >
            الكل ({invoices.length})
          </button>
          <button 
            onClick={() => setFilterStatus('completed')} 
            style={filterStatus === 'completed' ? styles.activeFilter : styles.filterBtn}
          >
            مدفوعة
          </button>
          <button 
            onClick={() => setFilterStatus('pending')} 
            style={filterStatus === 'pending' ? styles.activeFilter : styles.filterBtn}
          >
            غير مدفوعة
          </button>
        </div>
      </div>

      <div style={styles.invoicesList}>
        {filteredInvoices.map(invoice => {
          let invoiceData = {};
          try {
            invoiceData = invoice.notes ? JSON.parse(invoice.notes) : {};
          } catch (e) {
            invoiceData = {};
          }
          const items = invoiceData.items || [];
          
          return (
            <div key={invoice.id} style={styles.invoiceCard}>
              <div style={styles.invoiceHeader}>
                <div>
                  <h3 style={styles.invoiceNumber}>{invoice.invoice_no}</h3>
                  <p style={styles.invoiceDate}>{new Date(invoice.payment_date).toLocaleDateString('ar-KW')}</p>
                </div>
                <span style={getStatusBadgeStyle(invoice.status)}>
                  {invoice.status === 'completed' ? 'مدفوعة' : 'غير مدفوعة'}
                </span>
              </div>

              <div style={styles.invoiceBody}>
                <p><strong>المريض:</strong> {invoice.patient_name || 'غير محدد'}</p>
                <p><strong>الطبيب:</strong> {invoiceData.doctor_name || user?.full_name || 'غير محدد'}</p>
                {invoiceData.governorate && <p><strong>المحافظة:</strong> {invoiceData.governorate}</p>}
                {items.length > 0 && (
                  <div style={{marginTop: '10px'}}>
                    <strong>الخدمات:</strong>
                    <ul style={{margin: '5px 0', paddingRight: '20px'}}>
                      {items.map((item, idx) => (
                        <li key={idx}>{item.service} (×{item.quantity})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div style={styles.invoiceFooter}>
                <div style={styles.invoiceTotal}>
                  الإجمالي: <span style={{color: '#10B981', fontWeight: '700', fontSize: '20px'}}>
                    {parseFloat(invoice.amount).toFixed(3)} د.ك
                  </span>
                </div>
                <div style={styles.paymentMethodDisplay}>
                  <span style={{fontSize: '14px', color: '#64748B'}}>طريقة الدفع:</span>
                  <span style={styles.paymentMethodBadge}>
                    {getPaymentMethodIcon(invoice.payment_method)} {getPaymentMethodLabel(invoice.payment_method)}
                  </span>
                </div>
                <div style={styles.invoiceActions}>
                  <button onClick={() => printInvoice(invoice)} style={styles.printBtn}>
                    🖨️ طباعة
                  </button>
                  {canManageInvoices && invoice.status === 'pending' && (
                    <button 
                      onClick={async () => {
                        await api.updatePayment(invoice.id, { status: 'completed' });
                        loadData();
                      }}
                      style={styles.payBtn}
                    >
                      ✅ تأكيد الدفع
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredInvoices.length === 0 && (
        <div style={styles.empty}>لا توجد فواتير مسجلة</div>
      )}

      {showInvoiceModal && (
        <div style={styles.modalOverlay} onClick={() => setShowInvoiceModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {currentInvoice ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}
            </h2>
            <form onSubmit={handleSaveInvoice}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>المريض *</label>
                  <select 
                    value={invoiceForm.patient_id}
                    onChange={(e) => handlePatientChange(e.target.value)}
                    style={styles.input}
                    required
                  >
                    <option value="">اختر المريض</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.full_name || patient.national_id || `مريض #${patient.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {patientTreatments.length > 0 && (
                <div style={{
                  background: '#D1FAE5',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  border: '1px solid #10B981'
                }}>
                  <p style={{color: '#065F46', margin: 0, fontSize: '14px'}}>
                    ✅ تم تحميل {patientTreatments.length} علاج مكتمل للمريض تلقائياً
                  </p>
                </div>
              )}

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>الطبيب المعالج *</label>
                  <input 
                    type="text"
                    value={invoiceForm.doctor_name}
                    onChange={(e) => setInvoiceForm({...invoiceForm, doctor_name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>تاريخ الفاتورة *</label>
                  <input 
                    type="date"
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({...invoiceForm, invoice_date: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>طريقة الدفع *</label>
                  <select 
                    value={invoiceForm.payment_method}
                    onChange={(e) => setInvoiceForm({...invoiceForm, payment_method: e.target.value})}
                    style={styles.input}
                    required
                  >
                    <option value="cash">نقدي (Cash)</option>
                    <option value="knet">كي نت (KNET)</option>
                    <option value="card">بطاقة ائتمان (Credit Card)</option>
                    <option value="transfer">تحويل بنكي</option>
                    <option value="insurance">تأمين</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>المحافظة</label>
                  <select 
                    value={invoiceForm.governorate_id}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">اختر المحافظة</option>
                    {governorates.map(gov => (
                      <option key={gov.id} value={gov.id}>{gov.name_ar}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>المنطقة</label>
                  <select 
                    value={invoiceForm.area_id}
                    onChange={(e) => setInvoiceForm({...invoiceForm, area_id: e.target.value})}
                    style={styles.input}
                    disabled={!invoiceForm.governorate_id}
                  >
                    <option value="">اختر المنطقة</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.itemsSection}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <h3 style={{fontSize: '18px', color: '#334155'}}>الخدمات والعلاجات</h3>
                  <button type="button" onClick={addInvoiceItem} style={styles.addItemBtn}>
                    ➕ إضافة خدمة
                  </button>
                </div>

                <div style={styles.itemsTable}>
                  <div style={styles.itemsTableHeader}>
                    <div style={{flex: '3'}}>الخدمة / العلاج</div>
                    <div style={{flex: '1'}}>الكمية</div>
                    <div style={{flex: '1.5'}}>السعر (د.ك)</div>
                    <div style={{flex: '1.5'}}>الإجمالي</div>
                    <div style={{width: '50px'}}></div>
                  </div>

                  {invoiceForm.items.map((item, index) => (
                    <div key={index} style={styles.itemRow}>
                      <input 
                        type="text"
                        value={item.service}
                        onChange={(e) => updateInvoiceItem(index, 'service', e.target.value)}
                        placeholder="اسم الخدمة"
                        style={{...styles.input, flex: '3'}}
                        required
                      />
                      <input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                        min="1"
                        style={{...styles.input, flex: '1'}}
                        required
                      />
                      <input 
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateInvoiceItem(index, 'unit_price', e.target.value)}
                        step="0.001"
                        placeholder="0.000"
                        style={{...styles.input, flex: '1.5'}}
                        required
                      />
                      <div style={{flex: '1.5', padding: '10px', fontWeight: '600'}}>
                        {(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(3)}
                      </div>
                      {invoiceForm.items.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeInvoiceItem(index)}
                          style={styles.removeItemBtn}
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={styles.totalsSection}>
                  <div style={styles.totalRow}>
                    <span>المجموع الفرعي:</span>
                    <span style={{fontWeight: '600'}}>{calculateSubtotal().toFixed(3)} د.ك</span>
                  </div>
                  
                  <div style={styles.totalRow}>
                    <span>الخصم:</span>
                    <input 
                      type="number"
                      value={invoiceForm.discount}
                      onChange={(e) => setInvoiceForm({...invoiceForm, discount: e.target.value})}
                      step="0.001"
                      min="0"
                      style={{...styles.input, width: '150px', textAlign: 'left'}}
                    />
                  </div>

                  <div style={styles.totalRow}>
                    <span>رسوم إضافية:</span>
                    <input 
                      type="number"
                      value={invoiceForm.extra_fees}
                      onChange={(e) => setInvoiceForm({...invoiceForm, extra_fees: e.target.value})}
                      step="0.001"
                      min="0"
                      style={{...styles.input, width: '150px', textAlign: 'left'}}
                    />
                  </div>

                  <div style={{...styles.totalRow, borderTop: '2px solid #10B981', paddingTop: '10px', marginTop: '10px'}}>
                    <span style={{fontSize: '18px', fontWeight: '700'}}>الإجمالي النهائي:</span>
                    <span style={{fontSize: '22px', fontWeight: '700', color: '#10B981'}}>
                      {calculateTotal().toFixed(3)} د.ك
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>ملاحظات</label>
                <textarea 
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                  style={styles.textarea}
                  rows="3"
                  placeholder="أي ملاحظات إضافية على الفاتورة..."
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitBtn}>
                  {currentInvoice ? 'تحديث الفاتورة' : 'حفظ الفاتورة'}
                </button>
                <button type="button" onClick={() => setShowInvoiceModal(false)} style={styles.cancelBtn}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusBadgeStyle = (status) => {
  const baseStyle = { 
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700'
  };
  const colors = {
    pending: { background: '#FEF3C7', color: '#92400E' },
    completed: { background: '#D1FAE5', color: '#065F46' }
  };
  return { ...baseStyle, ...colors[status] };
};

const getPaymentMethodLabel = (method) => {
  const labels = {
    cash: 'نقدي',
    knet: 'كي نت (KNET)',
    card: 'بطاقة ائتمان',
    transfer: 'تحويل بنكي',
    insurance: 'تأمين'
  };
  return labels[method] || method;
};

const getPaymentMethodIcon = (method) => {
  const icons = {
    cash: '💵',
    knet: '💳',
    card: '💳',
    transfer: '🏦',
    insurance: '🏥'
  };
  return icons[method] || '💰';
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    fontSize: '32px',
    color: '#1E293B',
    fontWeight: '700',
    margin: 0
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748B',
    marginTop: '5px'
  },
  addButton: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#64748B'
  },
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '30px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    borderRadius: '16px',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
  },
  statIcon: {
    fontSize: '36px',
    marginBottom: '12px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '10px 0'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.95
  },
  controls: {
    marginBottom: '25px',
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  searchBox: {
    flex: 1,
    minWidth: '300px'
  },
  searchInput: {
    width: '100%',
    padding: '14px 18px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '15px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  filters: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '12px 24px',
    background: 'white',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.3s',
    fontWeight: '600',
    color: '#64748B'
  },
  activeFilter: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: '2px solid #667eea',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  },
  invoicesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '24px'
  },
  invoiceCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '2px solid #E2E8F0',
    transition: 'all 0.3s'
  },
  invoiceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '2px solid #F1F5F9'
  },
  invoiceNumber: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1E293B',
    margin: '0 0 5px 0'
  },
  invoiceDate: {
    fontSize: '14px',
    color: '#64748B'
  },
  invoiceBody: {
    fontSize: '15px',
    color: '#475569',
    lineHeight: '1.8',
    marginBottom: '16px'
  },
  invoiceFooter: {
    borderTop: '2px solid #F1F5F9',
    paddingTop: '16px'
  },
  invoiceTotal: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#334155'
  },
  paymentMethodDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    padding: '8px 12px',
    background: '#F8FAFC',
    borderRadius: '8px'
  },
  paymentMethodBadge: {
    padding: '4px 12px',
    background: '#E0F2FE',
    color: '#0369A1',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600'
  },
  invoiceActions: {
    display: 'flex',
    gap: '10px'
  },
  printBtn: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s'
  },
  payBtn: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s'
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    fontSize: '18px',
    color: '#94A3B8',
    background: 'white',
    borderRadius: '16px',
    border: '2px dashed #E2E8F0'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    overflowY: 'auto'
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  modalTitle: {
    fontSize: '26px',
    color: '#1E293B',
    marginBottom: '25px',
    fontWeight: '700'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s',
    fontFamily: 'inherit'
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  itemsSection: {
    background: '#F8FAFC',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  addItemBtn: {
    padding: '8px 16px',
    background: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  itemsTable: {
    marginTop: '15px'
  },
  itemsTableHeader: {
    display: 'flex',
    gap: '10px',
    padding: '12px',
    background: '#E2E8F0',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#475569',
    marginBottom: '10px'
  },
  itemRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    alignItems: 'center'
  },
  removeItemBtn: {
    width: '40px',
    height: '40px',
    background: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  totalsSection: {
    marginTop: '20px',
    padding: '20px',
    background: 'white',
    borderRadius: '10px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    fontSize: '16px'
  },
  modalActions: {
    display: 'flex',
    gap: '15px',
    marginTop: '25px',
    paddingTop: '25px',
    borderTop: '2px solid #F1F5F9'
  },
  submitBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s'
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    background: '#E2E8F0',
    color: '#475569',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    transition: 'all 0.3s'
  }
};

export default Invoices;
