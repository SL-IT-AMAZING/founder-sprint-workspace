UPDATE submissions
SET status = CASE
  WHEN EXISTS (
    SELECT 1
    FROM feedbacks
    WHERE feedbacks.submission_id = submissions.id
  ) THEN 'reviewed'
  ELSE 'pending'
END
WHERE status = 'pending';
