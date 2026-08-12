-- Every order a user can even see is already scoped to their own company
-- (the select policy), so gating a stage move behind a separate
-- "move_stage" role permission on top of that was redundant — anyone in the
-- company can already see the order and its stages. Drop the permission
-- check from order updates and the history entry a stage move writes;
-- company ownership alone is now the gate. Order deletes keep requiring
-- move_stage — this only relaxes moving a card between stages.

drop policy "orders: update own company with move_stage" on orders;
create policy "orders: update own company" on orders for update to authenticated
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy "stage_history: insert own or as matched customer" on stage_history;
create policy "stage_history: insert own or as matched customer" on stage_history for insert to authenticated
  with check (
    company_id = current_company_id()
    or (
      has_permission('create_order')
      and exists (
        select 1 from orders o
        where o.id = stage_history.order_id
          and o.customer_company_id = current_company_id()
          and o.company_id = stage_history.company_id
      )
    )
  );
