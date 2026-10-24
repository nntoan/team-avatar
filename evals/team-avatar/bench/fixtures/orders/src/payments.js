export async function loadPayments(api, orderId) {
  const response = await api.get(`/orders/${orderId}/payments`);
  if (!response.ok) throw new Error(`payments request failed: ${response.status}`);
  return response.json();
}
