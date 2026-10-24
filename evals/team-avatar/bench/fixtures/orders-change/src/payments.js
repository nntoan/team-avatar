export async function loadPayments(api, orderId) {
  try {
    const response = await api.get(`/orders/${orderId}/payments`);
    return await response.json();
  } catch {
    return [];
  }
}
