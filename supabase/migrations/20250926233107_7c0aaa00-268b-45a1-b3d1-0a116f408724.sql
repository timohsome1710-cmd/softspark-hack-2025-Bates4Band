-- Add some sample questions with different categories for testing
DO $$
DECLARE
    user_1_id uuid;
    user_2_id uuid;
    user_3_id uuid;
BEGIN
    -- Get existing user IDs (safely)
    SELECT id INTO user_1_id FROM profiles WHERE display_name = 'gerrard' LIMIT 1;
    SELECT id INTO user_2_id FROM profiles WHERE display_name = 'joel' LIMIT 1;
    SELECT id INTO user_3_id FROM profiles WHERE display_name = 'nurat' LIMIT 1;
    
    -- Only proceed if we have users
    IF user_1_id IS NOT NULL AND user_2_id IS NOT NULL AND user_3_id IS NOT NULL THEN
        
        -- Insert sample questions if they don't already exist
        INSERT INTO questions (title, content, category, difficulty, author_id, created_at) 
        SELECT * FROM (VALUES
            ('Calculus Integration Problem', 'How do I solve the integral of x^2 * sin(x) dx using integration by parts?', 'Mathematics', 'medium', user_1_id, NOW()),
            ('Physics Motion Problem', 'A ball is thrown upward with an initial velocity of 20 m/s. What is the maximum height reached?', 'Science', 'easy', user_2_id, NOW() - INTERVAL '2 hours'),
            ('Australian Federation History', 'What were the main factors that led to Australian Federation in 1901?', 'Social Studies', 'medium', user_3_id, NOW() - INTERVAL '1 day'),
            ('Linear Algebra Matrix Question', 'How do you find the determinant of a 3x3 matrix? Please explain step by step.', 'Mathematics', 'hard', user_1_id, NOW() - INTERVAL '3 hours'),
            ('Chemistry Balancing Equations', 'How do I balance the chemical equation: Al + HCl → AlCl3 + H2', 'Science', 'easy', user_2_id, NOW() - INTERVAL '5 hours'),
            ('World War II Impact', 'What was the impact of World War II on Australian society and economy?', 'Social Studies', 'hard', user_3_id, NOW() - INTERVAL '2 days')
        ) AS new_questions(title, content, category, difficulty, author_id, created_at)
        WHERE NOT EXISTS (
            SELECT 1 FROM questions q WHERE q.title = new_questions.title
        );
        
        -- Update user stats with some sample data
        UPDATE user_stats 
        SET 
            seasonal_exp = CASE 
                WHEN user_id = user_1_id THEN 850
                WHEN user_id = user_2_id THEN 650  
                WHEN user_id = user_3_id THEN 420
                ELSE seasonal_exp
            END,
            total_exp = CASE 
                WHEN user_id = user_1_id THEN 2850
                WHEN user_id = user_2_id THEN 1650  
                WHEN user_id = user_3_id THEN 1420
                ELSE total_exp
            END,
            level = CASE 
                WHEN user_id = user_1_id THEN 5
                WHEN user_id = user_2_id THEN 3  
                WHEN user_id = user_3_id THEN 2
                ELSE level
            END,
            questions_asked = CASE 
                WHEN user_id = user_1_id THEN 2
                WHEN user_id = user_2_id THEN 2  
                WHEN user_id = user_3_id THEN 2
                ELSE questions_asked
            END,
            trophy_rank = CASE 
                WHEN user_id = user_1_id THEN 'silver'::trophy_rank
                WHEN user_id = user_2_id THEN 'bronze'::trophy_rank
                WHEN user_id = user_3_id THEN 'bronze'::trophy_rank
                ELSE trophy_rank
            END
        WHERE user_id IN (user_1_id, user_2_id, user_3_id);
        
    END IF;
END $$;