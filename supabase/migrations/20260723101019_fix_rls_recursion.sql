/*
# TerraCerta — Fix infinite recursion in RLS policies

## Problem
The `select_own_profile` and `select_own_subscription` policies use subqueries
on `profiles` to check `is_admin`, but since `profiles` has RLS enabled, the
subquery triggers the RLS policy again, which does another subquery, causing
infinite recursion.

## Fix
Replace the subquery with the `is_admin()` SECURITY DEFINER function, which
bypasses RLS (SECURITY DEFINER runs with the function owner's privileges).
This breaks the recursion while preserving the same security check.
*/

-- Fix profiles SELECT policy
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

-- Fix subscriptions SELECT policy
DROP POLICY IF EXISTS "select_own_subscription" ON subscriptions;
CREATE POLICY "select_own_subscription" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());
